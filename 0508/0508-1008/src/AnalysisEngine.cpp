#include "AnalysisEngine.h"
#include "NullPointerDetector.h"
#include "UseAfterFreeDetector.h"
#include "DoubleFreeDetector.h"
#include "MemoryLeakDetector.h"
#include "ReachabilityAnalysis.h"
#include "llvm/IR/DebugInfo.h"
#include "llvm/IR/InstIterator.h"
#include "llvm/IR/Module.h"
#include "llvm/Analysis/MemoryBuiltins.h"
#include "llvm/Analysis/LoopInfo.h"
#include "llvm/IR/Dominators.h"
#include "llvm/IR/CFG.h"

#ifdef _WIN32
#include <windows.h>
#include <psapi.h>
#else
#include <sys/resource.h>
#include <unistd.h>
#endif

namespace memsafety {

bool AnalysisEngine::isAllocationFunction(llvm::Function* F) {
    if (!F) return false;
    if (!F->hasName()) return false;
    llvm::StringRef name = F->getName();
    return name == "malloc" || name == "calloc" || name == "realloc" ||
           name == "aligned_alloc" || name == "posix_memalign" ||
           name == "xmalloc" || name == "zmalloc" || name == "valloc";
}

bool AnalysisEngine::isFreeFunction(llvm::Function* F) {
    if (!F) return false;
    if (!F->hasName()) return false;
    llvm::StringRef name = F->getName();
    return name == "free" || name == "cfree" || name == "zfree" ||
           name == "xfree" || name == "realloc";
}

bool AnalysisEngine::isReallocationFunction(llvm::Function* F) {
    if (!F) return false;
    if (!F->hasName()) return false;
    return F->getName() == "realloc";
}

static size_t getCurrentMemoryUsageMB() {
#ifdef _WIN32
    PROCESS_MEMORY_COUNTERS_EX pmc;
    GetProcessMemoryInfo(GetCurrentProcess(), 
        reinterpret_cast<PROCESS_MEMORY_COUNTERS*>(&pmc), sizeof(pmc));
    return static_cast<size_t>(pmc.PrivateUsage / (1024 * 1024));
#else
    struct rusage usage;
    getrusage(RUSAGE_SELF, &usage);
    return static_cast<size_t>(usage.ru_maxrss / 1024);
#endif
}

bool AnalysisEngine::checkTimeout() {
    if (timedOut.load()) return true;
    
    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(now - startTime).count();
    
    if (elapsed >= static_cast<long long>(config.checks.timeoutSeconds)) {
        timedOut.store(true);
        if (config.verbose) {
            llvm::outs() << "Warning: Analysis timed out after " 
                        << config.checks.timeoutSeconds << " seconds\n";
        }
        return true;
    }
    
    return false;
}

bool AnalysisEngine::checkMemoryUsage() {
    if (config.checks.maxMemoryMB == 0) return false;
    
    size_t currentMB = getCurrentMemoryUsageMB();
    if (currentMB >= config.checks.maxMemoryMB) {
        if (config.verbose) {
            llvm::outs() << "Warning: Memory usage " << currentMB 
                        << "MB exceeds limit " << config.checks.maxMemoryMB << "MB\n";
        }
        return true;
    }
    return false;
}

bool AnalysisEngine::checkFunctionSize(llvm::Function& F) {
    if (!config.checks.enableFunctionSkipping) return true;
    
    unsigned instCount = 0;
    for (auto& BB : F) {
        instCount += BB.size();
        if (instCount > config.checks.maxFunctionSize) {
            if (config.verbose) {
                llvm::outs() << "Warning: Skipping large function '" << F.getName()
                            << "' with " << instCount << " instructions\n";
            }
            skippedFunctions++;
            return false;
        }
    }
    return true;
}

bool AnalysisEngine::checkPathLimit() {
    if (pathCount.load() >= config.checks.maxPathsPerFunction) {
        return true;
    }
    return false;
}

void AnalysisEngine::detectLoops(llvm::Function& F) {
    loopHeaders.clear();
    blockToLoop.clear();
    
    if (!config.checks.enableLoopDetection) return;
    
    llvm::DominatorTree DT(F);
    llvm::LoopInfo LI(DT);
    
    for (auto* L : LI) {
        llvm::BasicBlock* header = L->getHeader();
        if (header) {
            loopHeaders.insert(L);
            blockToLoop[header] = L;
            
            for (auto* BB : L->blocks()) {
                blockToLoop[BB] = L;
            }
            
            for (auto* SubLoop : *L) {
                for (auto* BB : SubLoop->blocks()) {
                    blockToLoop[BB] = SubLoop;
                }
            }
        }
    }
}

bool AnalysisEngine::isLoopHeader(llvm::BasicBlock* BB) {
    return blockToLoop.count(BB) && blockToLoop[BB]->getHeader() == BB;
}

bool AnalysisEngine::shouldWiden(llvm::BasicBlock* BB, unsigned visitCount) {
    if (!config.checks.enableWidening) return false;
    
    if (isLoopHeader(BB) && visitCount >= config.checks.wideningThreshold) {
        return true;
    }
    
    if (visitCount >= config.checks.wideningThreshold * 2) {
        return true;
    }
    
    return false;
}

void AnalysisEngine::trimState(AbstractState& state) {
    if (state.pointers.size() > 1000) {
        llvm::SmallVector<llvm::Value*, 64> toRemove;
        for (auto& [val, info] : state.pointers) {
            if (info.state == PointerState::UNKNOWN && 
                !info.isHeapAllocated && !info.isFreed) {
                toRemove.push_back(val);
            }
        }
        for (auto* val : toRemove) {
            state.pointers.erase(val);
        }
    }
    
    if (state.pathCond.constraints.size() > 32) {
        state.pathCond.constraints.erase(
            state.pathCond.constraints.begin(),
            state.pathCond.constraints.end() - 16
        );
    }
}

void AnalysisEngine::mergeOrWidenState(llvm::BasicBlock* BB, const AbstractState& newState) {
    auto it = entryStates.find(BB);
    if (it == entryStates.end()) {
        entryStates[BB] = newState;
    } else if (!config.checks.pathSensitive || !config.checks.mergeStatesAtJoins) {
        return;
    } else {
        AbstractState& existing = it->second;
        
        if (shouldWiden(BB, visitCounts[BB])) {
            existing.widen(newState);
            if (config.debug) {
                llvm::outs() << "Widening state at BB " << BB->getName() << "\n";
            }
        } else {
            existing.merge(newState);
        }
    }
}

std::vector<Issue> AnalysisEngine::analyzeModule(llvm::Module& M) {
    issues.clear();
    
    for (auto& F : M) {
        if (F.isDeclaration() || F.empty()) continue;
        
        if (checkTimeout() || checkMemoryUsage()) {
            if (config.verbose) {
                llvm::outs() << "Analysis aborted due to timeout or memory limit\n";
            }
            break;
        }
        
        if (config.debug) {
            llvm::outs() << "Analyzing function: " << F.getName() << "\n";
        }
        
        if (!checkFunctionSize(F)) {
            continue;
        }
        
        analyzeFunction(F);
    }
    
    if (config.checks.enableMemoryLeak) {
        MemoryLeakDetector leakDetector(*this);
        for (auto& F : M) {
            if (F.isDeclaration() || F.empty()) continue;
            if (checkTimeout()) break;
            leakDetector.analyzeFunction(F);
            leakDetector.checkLeaks(F);
        }
    }
    
    if (config.checks.enableUnreachableCode && config.checks.enableReachabilityAnalysis) {
        DeadErrorCodeDetector deadCodeDetector(*this);
        for (auto& F : M) {
            if (F.isDeclaration() || F.empty()) continue;
            if (checkTimeout()) break;
            deadCodeDetector.detectInFunction(F);
        }
    }
    
    return issues;
}

void AnalysisEngine::analyzeFunction(llvm::Function& F) {
    entryStates.clear();
    exitStates.clear();
    visitCounts.clear();
    pathCount = 0;
    
    detectLoops(F);
    
    AbstractState initialState;
    initialState.depth = 0;
    
    for (auto& Arg : F.args()) {
        PointerInfo info;
        info.state = PointerState::MAYBE_NULL;
        if (Arg.getType()->isPointerTy()) {
            initialState.pointers[&Arg] = info;
        }
    }
    
    if (!F.empty()) {
        entryStates[&F.front()] = initialState;
        visitCounts[&F.front()] = 0;
    }
    
    std::queue<WorklistItem> worklist;
    if (!F.empty()) {
        worklist.emplace(&F.front(), initialState, 0);
    }
    
    while (!worklist.empty() && !checkTimeout() && !checkMemoryUsage()) {
        WorklistItem item = std::move(worklist.front());
        worklist.pop();
        
        llvm::BasicBlock* BB = item.block;
        AbstractState state = item.state;
        unsigned visitCount = item.visitCount;
        
        visitCounts[BB] = std::max(visitCounts[BB], visitCount + 1);
        
        if (state.depth > config.checks.maxPathDepth) {
            if (config.debug) {
                llvm::outs() << "Path depth limit reached at BB " << BB->getName() << "\n";
            }
            continue;
        }
        
        if (checkPathLimit()) {
            if (config.verbose && pathCount == config.checks.maxPathsPerFunction) {
                llvm::outs() << "Warning: Path limit reached in function '" 
                            << F.getName() << "'\n";
            }
            continue;
        }
        
        trimState(state);
        
        analyzeBasicBlock(*BB, state);
        
        auto term = BB->getTerminator();
        for (unsigned i = 0; i < term->getNumSuccessors(); ++i) {
            llvm::BasicBlock* succ = term->getSuccessor(i);
            AbstractState succState = state;
            succState.depth++;
            transferState(BB, succ, succState);
            
            pathCount++;
            
            unsigned succVisitCount = visitCounts.lookup(succ);
            
            if (shouldWiden(succ, succVisitCount)) {
                trimState(succState);
                succState.widen(succState);
                if (config.debug) {
                    llvm::outs() << "Applying widening at loop header " 
                                << succ->getName() << "\n";
                }
            }
            
            if (config.checks.pathSensitive) {
                worklist.emplace(succ, succState, succVisitCount);
            } else {
                mergeOrWidenState(succ, succState);
                if (succVisitCount == 0) {
                    worklist.emplace(succ, entryStates[succ], 0);
                }
            }
        }
    }
}

void AnalysisEngine::analyzeBasicBlock(llvm::BasicBlock& BB, AbstractState& state) {
    for (auto& I : BB) {
        if (checkTimeout()) break;
        
        instructionCount++;
        analyzeInstruction(I, state);
    }
    exitStates[&BB] = state;
}

void AnalysisEngine::analyzeInstruction(llvm::Instruction& I, AbstractState& state) {
    if (auto* LI = llvm::dyn_cast<llvm::LoadInst>(&I)) {
        handleLoad(LI, state);
    } else if (auto* SI = llvm::dyn_cast<llvm::StoreInst>(&I)) {
        handleStore(SI, state);
    } else if (auto* CI = llvm::dyn_cast<llvm::CallInst>(&I)) {
        handleCall(CI, state);
    } else if (auto* GEP = llvm::dyn_cast<llvm::GetElementPtrInst>(&I)) {
        handlePointerArithmetic(GEP, state);
    } else if (auto* CMP = llvm::dyn_cast<llvm::ICmpInst>(&I)) {
        handleICmp(CMP, state);
    } else if (auto* RI = llvm::dyn_cast<llvm::ReturnInst>(&I)) {
        handleReturn(RI, state);
    }
}

void AnalysisEngine::handleAllocation(llvm::CallInst* CI, AbstractState& state) {
    PointerInfo info;
    info.state = PointerState::NOT_NULL;
    info.isHeapAllocated = true;
    info.isFreed = false;
    state.pointers[CI] = info;
}

void AnalysisEngine::handleFree(llvm::CallInst* CI, AbstractState& state) {
    if (CI->arg_size() == 0) return;
    
    llvm::Value* ptr = CI->getArgOperand(0);
    ptr = ptr->stripPointerCasts();
    
    if (config.checks.enableDoubleFree) {
        DoubleFreeDetector dfDetector(*this);
        dfDetector.checkFree(CI, ptr, state);
    }
    
    auto it = state.pointers.find(ptr);
    if (it != state.pointers.end()) {
        it->second.state = PointerState::FREED;
        it->second.isFreed = true;
    } else {
        PointerInfo info;
        info.state = PointerState::FREED;
        info.isFreed = true;
        state.pointers[ptr] = info;
    }
}

void AnalysisEngine::handleLoad(llvm::LoadInst* LI, AbstractState& state) {
    llvm::Value* ptr = LI->getPointerOperand();
    ptr = ptr->stripPointerCasts();
    
    if (config.checks.enableNullPointer) {
        checkNullDereference(ptr, LI, state);
    }
    
    if (config.checks.enableUseAfterFree) {
        checkUseAfterFree(ptr, LI, state);
    }
}

void AnalysisEngine::handleStore(llvm::StoreInst* SI, AbstractState& state) {
    llvm::Value* ptr = SI->getPointerOperand();
    llvm::Value* val = SI->getValueOperand();
    ptr = ptr->stripPointerCasts();
    val = val->stripPointerCasts();
    
    if (config.checks.enableNullPointer) {
        checkNullDereference(ptr, SI, state);
    }
    
    if (config.checks.enableUseAfterFree) {
        checkUseAfterFree(ptr, SI, state);
    }
    
    if (auto* C = llvm::dyn_cast<llvm::Constant>(val)) {
        if (C->isNullValue() && ptr->getType()->isPointerTy()) {
            state.setState(ptr, PointerState::DEFINITELY_NULL);
        }
    } else if (val->getType()->isPointerTy()) {
        auto it = state.pointers.find(val);
        if (it != state.pointers.end()) {
            state.pointers[ptr] = it->second;
        }
    }
}

void AnalysisEngine::handleCall(llvm::CallInst* CI, AbstractState& state) {
    llvm::Function* F = CI->getCalledFunction();
    
    if (isAllocationFunction(F)) {
        handleAllocation(CI, state);
    } else if (isFreeFunction(F)) {
        handleFree(CI, state);
    } else {
        if (CI->isIndirectCall() && config.checks.enableNullPointer) {
            llvm::Value* calledVal = CI->getCalledOperand();
            NullPointerDetector npDetector(*this);
            npDetector.checkFunctionPointerCall(CI, state);
        }
        
        for (unsigned i = 0; i < CI->arg_size(); ++i) {
            llvm::Value* arg = CI->getArgOperand(i);
            if (arg->getType()->isPointerTy()) {
                if (config.checks.enableUseAfterFree) {
                    checkUseAfterFree(arg, CI, state);
                }
                if (config.checks.enableNullPointer) {
                    checkNullDereference(arg, CI, state);
                }
            }
        }
        
        if (F && !F->isDeclaration() && config.checks.contextSensitive) {
        }
    }
}

void AnalysisEngine::handleReturn(llvm::ReturnInst* RI, AbstractState& state) {
    if (RI->getNumOperands() == 0) return;
    
    llvm::Value* retVal = RI->getReturnValue();
    if (!retVal || !retVal->getType()->isPointerTy()) return;
    
    retVal = retVal->stripPointerCasts();
    auto it = state.pointers.find(retVal);
    if (it != state.pointers.end()) {
        llvm::Function* F = RI->getFunction();
        functionSummary[F][retVal] = it->second.state;
    }
}

void AnalysisEngine::handlePointerArithmetic(llvm::GetElementPtrInst* GEP, AbstractState& state) {
    llvm::Value* ptr = GEP->getPointerOperand();
    ptr = ptr->stripPointerCasts();
    
    if (config.checks.enableNullPointer) {
        NullPointerDetector npDetector(*this);
        npDetector.checkArrayAccess(GEP, state);
    }
    
    if (config.checks.enableUseAfterFree) {
        UseAfterFreeDetector uafDetector(*this);
        uafDetector.checkGEP(GEP, state);
    }
    
    auto it = state.pointers.find(ptr);
    if (it != state.pointers.end()) {
        state.pointers[GEP] = it->second;
    }
}

void AnalysisEngine::handleICmp(llvm::ICmpInst* CMP, AbstractState& state) {
    llvm::Value* op0 = CMP->getOperand(0);
    llvm::Value* op1 = CMP->getOperand(1);
    
    op0 = op0->stripPointerCasts();
    op1 = op1->stripPointerCasts();
    
    if (auto* C = llvm::dyn_cast<llvm::Constant>(op1)) {
        if (C->isNullValue() && op0->getType()->isPointerTy()) {
            if (CMP->getPredicate() == llvm::CmpInst::ICMP_EQ) {
                state.pathCond.constraints.push_back({op0, true});
            } else if (CMP->getPredicate() == llvm::CmpInst::ICMP_NE) {
                state.pathCond.constraints.push_back({op0, false});
            }
        }
    }
    
    if (auto* C = llvm::dyn_cast<llvm::Constant>(op0)) {
        if (C->isNullValue() && op1->getType()->isPointerTy()) {
            if (CMP->getPredicate() == llvm::CmpInst::ICMP_EQ) {
                state.pathCond.constraints.push_back({op1, true});
            } else if (CMP->getPredicate() == llvm::CmpInst::ICMP_NE) {
                state.pathCond.constraints.push_back({op1, false});
            }
        }
    }
}

void AnalysisEngine::checkNullDereference(llvm::Value* ptr, llvm::Instruction* I, AbstractState& state) {
    if (!config.checks.enableNullPointer) return;
    NullPointerDetector detector(*this);
    detector.checkDereference(ptr, I, state);
}

void AnalysisEngine::checkUseAfterFree(llvm::Value* ptr, llvm::Instruction* I, AbstractState& state) {
    if (!config.checks.enableUseAfterFree) return;
    UseAfterFreeDetector detector(*this);
    detector.checkUse(ptr, I, state);
}

void AnalysisEngine::checkDoubleFree(llvm::Value* ptr, llvm::CallInst* CI, AbstractState& state) {
    if (!config.checks.enableDoubleFree) return;
    DoubleFreeDetector detector(*this);
    detector.checkFree(CI, ptr, state);
}

void AnalysisEngine::transferState(llvm::BasicBlock* from, llvm::BasicBlock* to, AbstractState& state) {
    if (auto* BR = llvm::dyn_cast<llvm::BranchInst>(from->getTerminator())) {
        if (BR->isConditional()) {
            llvm::Value* cond = BR->getCondition();
            if (auto* CMP = llvm::dyn_cast<llvm::ICmpInst>(cond)) {
                bool isTrue = (to == BR->getSuccessor(0));
                
                llvm::Value* op0 = CMP->getOperand(0);
                llvm::Value* op1 = CMP->getOperand(1);
                
                op0 = op0->stripPointerCasts();
                op1 = op1->stripPointerCasts();
                
                if (auto* C = llvm::dyn_cast<llvm::Constant>(op1)) {
                    if (C->isNullValue() && op0->getType()->isPointerTy()) {
                        if (CMP->getPredicate() == llvm::CmpInst::ICMP_EQ) {
                            if (isTrue) {
                                state.setState(op0, PointerState::DEFINITELY_NULL);
                            } else {
                                state.setState(op0, PointerState::NOT_NULL);
                            }
                        } else if (CMP->getPredicate() == llvm::CmpInst::ICMP_NE) {
                            if (isTrue) {
                                state.setState(op0, PointerState::NOT_NULL);
                            } else {
                                state.setState(op0, PointerState::DEFINITELY_NULL);
                            }
                        }
                    }
                }
            }
        }
    }
}

} // namespace memsafety
