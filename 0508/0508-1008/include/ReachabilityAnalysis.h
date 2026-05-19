#ifndef MEMSAFETY_REACHABILITYANALYSIS_H
#define MEMSAFETY_REACHABILITYANALYSIS_H

#include "Common.h"
#include "llvm/IR/Function.h"
#include "llvm/IR/BasicBlock.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/Dominators.h"
#include "llvm/ADT/DenseMap.h"
#include "llvm/ADT/SmallPtrSet.h"
#include "llvm/ADT/SmallVector.h"
#include <set>
#include <map>
#include <vector>
#include <string>

namespace memsafety {

enum class ErrorHandlerType {
    NONE,
    GOTO_ERROR,
    IF_ERROR_THEN,
    SWITCH_ERROR_CASE,
    TRY_CATCH_LIKE,
    CHECK_AND_RETURN,
    LOG_AND_RETURN,
    FREE_AND_RETURN,
    SET_ERROR_AND_RETURN,
    UNLOCK_AND_RETURN
};

struct ErrorHandlerInfo {
    llvm::BasicBlock* block;
    ErrorHandlerType type;
    std::string errorLabel;
    llvm::BasicBlock* entryBlock;
    llvm::SmallVector<llvm::BasicBlock*, 8> dominatedBlocks;
    bool isReachable;
    bool isErrorHandler;
};

class ReachabilityAnalysis {
public:
    ReachabilityAnalysis(llvm::Function& F) : function(F) {}
    
    void analyze();
    
    bool isReachable(llvm::BasicBlock* BB) const {
        return reachableBlocks.count(BB);
    }
    
    bool isErrorHandler(llvm::BasicBlock* BB) const {
        auto it = errorHandlers.find(BB);
        return it != errorHandlers.end() && it->second.isErrorHandler;
    }
    
    const ErrorHandlerInfo* getErrorHandlerInfo(llvm::BasicBlock* BB) const {
        auto it = errorHandlers.find(BB);
        if (it != errorHandlers.end()) {
            return &it->second;
        }
        return nullptr;
    }
    
    const llvm::SmallPtrSet<llvm::BasicBlock*, 32>& getReachableBlocks() const {
        return reachableBlocks;
    }
    
    const llvm::SmallPtrSet<llvm::BasicBlock*, 32>& getUnreachableBlocks() const {
        return unreachableBlocks;
    }
    
    const llvm::DenseMap<llvm::BasicBlock*, ErrorHandlerInfo>& getErrorHandlers() const {
        return errorHandlers;
    }
    
    llvm::SmallVector<llvm::BasicBlock*, 16> getUnreachableErrorHandlers() const;
    
    bool isErrorHandlingPattern(llvm::BasicBlock* BB) const;
    
    static ErrorHandlerType classifyErrorHandler(llvm::BasicBlock* BB);
    
    static bool isErrorIndicator(const std::string& name);
    
    static bool isErrorFunction(llvm::Function* F);
    
private:
    llvm::Function& function;
    
    llvm::SmallPtrSet<llvm::BasicBlock*, 32> reachableBlocks;
    llvm::SmallPtrSet<llvm::BasicBlock*, 32> unreachableBlocks;
    llvm::DenseMap<llvm::BasicBlock*, ErrorHandlerInfo> errorHandlers;
    
    void computeReachability();
    void identifyErrorHandlers();
    void propagateReachability();
    
    bool hasErrorPatternInName(llvm::Value* val) const;
    bool analyzeBlockPattern(llvm::BasicBlock* BB, ErrorHandlerInfo& info) const;
    bool isGotoErrorPattern(llvm::BasicBlock* BB) const;
    bool isReturnErrorPattern(llvm::BasicBlock* BB) const;
    bool containsErrorCall(llvm::BasicBlock* BB) const;
    bool containsErrorCode(llvm::BasicBlock* BB) const;
    bool containsUnlockOperation(llvm::BasicBlock* BB) const;
    bool containsFreeOperation(llvm::BasicBlock* BB) const;
};

class DeadErrorCodeDetector {
public:
    DeadErrorCodeDetector(AnalysisEngine& engine) : engine(engine) {}
    
    void detectInFunction(llvm::Function& F);
    
private:
    AnalysisEngine& engine;
    
    void reportUnreachableErrorHandler(const ErrorHandlerInfo& info, llvm::Function& F);
    void reportDeadErrorPath(llvm::BasicBlock* source, llvm::BasicBlock* handler, llvm::Function& F);
    
    bool isTrueUnreachable(llvm::BasicBlock* BB, 
                          const ReachabilityAnalysis& RA,
                          llvm::DominatorTree& DT) const;
    
    bool isConditionAlwaysFalse(llvm::BranchInst* BR) const;
    bool isConstantFalseCondition(llvm::Value* cond) const;
};

} // namespace memsafety

#endif // MEMSAFETY_REACHABILITYANALYSIS_H
