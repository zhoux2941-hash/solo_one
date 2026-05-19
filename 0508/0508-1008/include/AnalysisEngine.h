#ifndef MEMSAFETY_ANALYSISENGINE_H
#define MEMSAFETY_ANALYSISENGINE_H

#include "Common.h"
#include "llvm/IR/Module.h"
#include "llvm/IR/Function.h"
#include "llvm/IR/BasicBlock.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/Value.h"
#include "llvm/IR/Constants.h"
#include "llvm/IR/Operator.h"
#include "llvm/IR/Dominators.h"
#include "llvm/Analysis/LoopInfo.h"
#include "llvm/ADT/DenseMap.h"
#include "llvm/ADT/SmallPtrSet.h"
#include "llvm/ADT/SmallVector.h"
#include "llvm/Support/raw_ostream.h"
#include <chrono>
#include <atomic>
#include <unordered_map>
#include <unordered_set>

namespace memsafety {

enum class PointerState : uint8_t {
    UNKNOWN = 0,
    NOT_NULL,
    MAYBE_NULL,
    DEFINITELY_NULL,
    FREED,
    ALLOCATED
};

struct PointerInfo {
    PointerState state : 4;
    bool isHeapAllocated : 1;
    bool isFreed : 1;
    
    PointerInfo() 
        : state(PointerState::UNKNOWN), 
          isHeapAllocated(false), 
          isFreed(false) {}
};

struct PathCondition {
    llvm::SmallVector<std::pair<llvm::Value*, bool>, 8> constraints;
    
    bool isFeasible() const { return true; }
    
    bool impliesNull(llvm::Value* ptr) const {
        for (const auto& [val, isTrue] : constraints) {
            if (val == ptr && isTrue) {
                if (auto* c = llvm::dyn_cast<llvm::Constant>(val)) {
                    if (c->isNullValue()) return true;
                }
            }
        }
        return false;
    }
    
    bool impliesNotNull(llvm::Value* ptr) const {
        return false;
    }
    
    void clear() { constraints.clear(); }
};

struct AbstractState {
    llvm::DenseMap<llvm::Value*, PointerInfo> pointers;
    PathCondition pathCond;
    unsigned depth = 0;
    
    void merge(const AbstractState& other) {
        for (const auto& [val, info] : other.pointers) {
            auto it = pointers.find(val);
            if (it == pointers.end()) {
                pointers[val] = info;
            } else {
                if (it->second.state != info.state) {
                    it->second.state = PointerState::UNKNOWN;
                }
                if (info.isHeapAllocated) {
                    it->second.isHeapAllocated = true;
                }
            }
        }
    }
    
    void widen(const AbstractState& other) {
        merge(other);
        for (auto& [val, info] : pointers) {
            if (info.state != PointerState::DEFINITELY_NULL &&
                info.state != PointerState::FREED) {
                info.state = PointerState::UNKNOWN;
            }
        }
        pathCond.clear();
    }
    
    PointerState getState(llvm::Value* val) const {
        auto it = pointers.find(val);
        if (it != pointers.end()) return it->second.state;
        return PointerState::UNKNOWN;
    }
    
    void setState(llvm::Value* val, PointerState state) {
        pointers[val].state = state;
    }
    
    size_t getMemoryUsage() const {
        return pointers.getMemorySize() + 
               constraintsMemoryUsage();
    }
    
private:
    size_t constraintsMemoryUsage() const {
        return pathCond.constraints.size() * 
               sizeof(std::pair<llvm::Value*, bool>);
    }
};

class WorklistItem {
public:
    llvm::BasicBlock* block;
    AbstractState state;
    unsigned visitCount;
    
    WorklistItem(llvm::BasicBlock* b, const AbstractState& s, unsigned count = 0)
        : block(b), state(s), visitCount(count) {}
};

class ReachabilityAnalysis;
class DeadErrorCodeDetector;

class AnalysisEngine {
public:
    AnalysisEngine(const Config& config) : config(config) {
        startTime = std::chrono::steady_clock::now();
        pathCount = 0;
        instructionCount = 0;
        timedOut = false;
        skippedFunctions = 0;
    }
    
    std::vector<Issue> analyzeModule(llvm::Module& M);
    
    void addIssue(const Issue& issue) {
        issues.push_back(issue);
    }
    
    const std::vector<Issue>& getIssues() const { return issues; }
    const Config& getConfig() const { return config; }
    
    static bool isAllocationFunction(llvm::Function* F);
    static bool isFreeFunction(llvm::Function* F);
    static bool isReallocationFunction(llvm::Function* F);
    
    bool hasTimedOut() const { return timedOut.load(); }
    unsigned getSkippedFunctions() const { return skippedFunctions; }
    unsigned getPathCount() const { return pathCount; }
    
private:
    Config config;
    std::vector<Issue> issues;
    
    std::chrono::steady_clock::time_point startTime;
    std::atomic<bool> timedOut;
    std::atomic<unsigned> pathCount;
    std::atomic<unsigned> instructionCount;
    unsigned skippedFunctions;
    
    llvm::DenseMap<llvm::BasicBlock*, AbstractState> entryStates;
    llvm::DenseMap<llvm::BasicBlock*, AbstractState> exitStates;
    llvm::DenseMap<llvm::BasicBlock*, unsigned> visitCounts;
    llvm::DenseMap<llvm::Function*, llvm::DenseMap<llvm::Value*, PointerState>> functionSummary;
    
    std::unordered_set<llvm::Loop*> loopHeaders;
    llvm::DenseMap<llvm::BasicBlock*, llvm::Loop*> blockToLoop;
    
    void analyzeFunction(llvm::Function& F);
    void analyzeBasicBlock(llvm::BasicBlock& BB, AbstractState& state);
    void analyzeInstruction(llvm::Instruction& I, AbstractState& state);
    
    void handleAllocation(llvm::CallInst* CI, AbstractState& state);
    void handleFree(llvm::CallInst* CI, AbstractState& state);
    void handleLoad(llvm::LoadInst* LI, AbstractState& state);
    void handleStore(llvm::StoreInst* SI, AbstractState& state);
    void handleCall(llvm::CallInst* CI, AbstractState& state);
    void handleReturn(llvm::ReturnInst* RI, AbstractState& state);
    void handlePointerArithmetic(llvm::GetElementPtrInst* GEP, AbstractState& state);
    void handleICmp(llvm::ICmpInst* CMP, AbstractState& state);
    
    void checkNullDereference(llvm::Value* ptr, llvm::Instruction* I, AbstractState& state);
    void checkUseAfterFree(llvm::Value* ptr, llvm::Instruction* I, AbstractState& state);
    void checkDoubleFree(llvm::Value* ptr, llvm::CallInst* CI, AbstractState& state);
    
    void transferState(llvm::BasicBlock* from, llvm::BasicBlock* to, AbstractState& state);
    
    bool checkTimeout();
    bool checkFunctionSize(llvm::Function& F);
    bool checkPathLimit();
    bool checkMemoryUsage();
    
    void detectLoops(llvm::Function& F);
    bool isLoopHeader(llvm::BasicBlock* BB);
    bool shouldWiden(llvm::BasicBlock* BB, unsigned visitCount);
    
    void trimState(AbstractState& state);
    void mergeOrWidenState(llvm::BasicBlock* BB, const AbstractState& newState);
};

} // namespace memsafety

#endif // MEMSAFETY_ANALYSISENGINE_H
