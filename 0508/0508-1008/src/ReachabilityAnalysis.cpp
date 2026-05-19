#include "ReachabilityAnalysis.h"
#include "AnalysisEngine.h"
#include "llvm/IR/DebugInfo.h"
#include "llvm/IR/InstIterator.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/CFG.h"
#include "llvm/Support/raw_ostream.h"
#include <queue>
#include <algorithm>

namespace memsafety {

bool ReachabilityAnalysis::isErrorIndicator(const std::string& name) {
    std::string lower = name;
    std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);
    
    static const std::vector<std::string> errorPatterns = {
        "error", "err", "fail", "fail", "abort", "exit", "die",
        "cleanup", "free_", "release", "unlock", "detach",
        "goto_err", "goto_error", "label_err", "label_error",
        "out_of_memory", "oom", "invalid", "bad_", "null",
        "handle_error", "error_handling", "on_error",
        "log_err", "log_error", "debug_err", "trace_err",
        "set_errno", "perror", "strerror"
    };
    
    for (const auto& pattern : errorPatterns) {
        if (lower.find(pattern) != std::string::npos) {
            return true;
        }
    }
    
    return false;
}

bool ReachabilityAnalysis::isErrorFunction(llvm::Function* F) {
    if (!F || !F->hasName()) return false;
    
    llvm::StringRef name = F->getName();
    return name == "abort" || name == "exit" || name == "_exit" ||
           name == "quick_exit" || name == "thrd_exit" ||
           name == "longjmp" || name == "_longjmp" ||
           name == "error" || name == "err" ||
           name == "perror" || name == "strerror" ||
           name == "assert" || name == "__assert_fail" ||
           name.startswith("log_") || name.startswith("debug_") ||
           name.contains("error") || name.contains("fail");
}

ErrorHandlerType ReachabilityAnalysis::classifyErrorHandler(llvm::BasicBlock* BB) {
    if (!BB) return ErrorHandlerType::NONE;
    
    if (BB->hasName()) {
        std::string name = BB->getName().str();
        if (name == "error" || name == "err" || name == "fail") {
            return ErrorHandlerType::GOTO_ERROR;
        }
        if (name.find("error") != std::string::npos || 
            name.find("err_") == 0 ||
            name.find("fail") != std::string::npos) {
            return ErrorHandlerType::GOTO_ERROR;
        }
        if (name.find("cleanup") != std::string::npos) {
            return ErrorHandlerType::FREE_AND_RETURN;
        }
    }
    
    bool hasFree = false;
    bool hasUnlock = false;
    bool hasReturn = false;
    bool hasErrorCall = false;
    bool hasErrorStore = false;
    
    for (auto& I : *BB) {
        if (auto* CI = llvm::dyn_cast<llvm::CallInst>(&I)) {
            llvm::Function* F = CI->getCalledFunction();
            if (isErrorFunction(F)) {
                hasErrorCall = true;
            }
            if (F && (F->getName() == "free" || F->getName() == "xfree" || F->getName() == "zfree")) {
                hasFree = true;
            }
            if (F && (F->getName().contains("unlock") || F->getName().contains("release"))) {
                hasUnlock = true;
            }
        }
        if (auto* SI = llvm::dyn_cast<llvm::StoreInst>(&I)) {
            llvm::Value* val = SI->getValueOperand();
            if (auto* C = llvm::dyn_cast<llvm::ConstantInt>(val)) {
                if (C->isNegative() || C->getZExtValue() == 0) {
                    if (SI->getPointerOperand()->hasName()) {
                        std::string name = SI->getPointerOperand()->getName().str();
                        if (name.find("err") != std::string::npos || name.find("rc") != std::string::npos ||
                            name.find("ret") != std::string::npos || name.find("status") != std::string::npos) {
                            hasErrorStore = true;
                        }
                    }
                }
            }
        }
        if (llvm::isa<llvm::ReturnInst>(&I)) {
            hasReturn = true;
        }
    }
    
    if (hasFree && hasReturn && hasErrorStore) {
        return ErrorHandlerType::FREE_AND_RETURN;
    }
    if (hasUnlock && hasReturn) {
        return ErrorHandlerType::UNLOCK_AND_RETURN;
    }
    if (hasErrorCall && hasReturn) {
        return ErrorHandlerType::LOG_AND_RETURN;
    }
    if (hasErrorStore && hasReturn) {
        return ErrorHandlerType::SET_ERROR_AND_RETURN;
    }
    if (hasReturn && hasFree) {
        return ErrorHandlerType::CHECK_AND_RETURN;
    }
    
    return ErrorHandlerType::NONE;
}

void ReachabilityAnalysis::computeReachability() {
    reachableBlocks.clear();
    
    if (function.empty()) return;
    
    std::queue<llvm::BasicBlock*> worklist;
    llvm::BasicBlock* entry = &function.front();
    worklist.push(entry);
    reachableBlocks.insert(entry);
    
    while (!worklist.empty()) {
        llvm::BasicBlock* BB = worklist.front();
        worklist.pop();
        
        auto term = BB->getTerminator();
        for (unsigned i = 0; i < term->getNumSuccessors(); ++i) {
            llvm::BasicBlock* succ = term->getSuccessor(i);
            
            if (auto* BR = llvm::dyn_cast<llvm::BranchInst>(term)) {
                if (BR->isConditional()) {
                    llvm::Value* cond = BR->getCondition();
                    if (auto* C = llvm::dyn_cast<llvm::ConstantInt>(cond)) {
                        if (C->isOne() && i == 1) continue;
                        if (C->isZero() && i == 0) continue;
                    }
                }
            }
            
            if (reachableBlocks.insert(succ).second) {
                worklist.push(succ);
            }
        }
    }
    
    for (auto& BB : function) {
        if (!reachableBlocks.count(&BB)) {
            unreachableBlocks.insert(&BB);
        }
    }
}

bool ReachabilityAnalysis::hasErrorPatternInName(llvm::Value* val) const {
    if (!val || !val->hasName()) return false;
    return isErrorIndicator(val->getName().str());
}

bool ReachabilityAnalysis::containsErrorCall(llvm::BasicBlock* BB) const {
    for (auto& I : *BB) {
        if (auto* CI = llvm::dyn_cast<llvm::CallInst>(&I)) {
            if (isErrorFunction(CI->getCalledFunction())) {
                return true;
            }
        }
    }
    return false;
}

bool ReachabilityAnalysis::containsErrorCode(llvm::BasicBlock* BB) const {
    for (auto& I : *BB) {
        if (auto* SI = llvm::dyn_cast<llvm::StoreInst>(&I)) {
            if (auto* C = llvm::dyn_cast<llvm::ConstantInt>(SI->getValueOperand())) {
                if (C->isNegative() || C->getZExtValue() == 0) {
                    llvm::Value* ptr = SI->getPointerOperand();
                    if (ptr->hasName()) {
                        std::string name = ptr->getName().str();
                        if (name.find("err") != std::string::npos || 
                            name.find("rc") != std::string::npos ||
                            name.find("ret") != std::string::npos) {
                            return true;
                        }
                    }
                }
            }
        }
        if (auto* RI = llvm::dyn_cast<llvm::ReturnInst>(&I)) {
            if (RI->getNumOperands() > 0) {
                llvm::Value* retVal = RI->getReturnValue();
                if (auto* C = llvm::dyn_cast<llvm::ConstantInt>(retVal)) {
                    if (C->isNegative() || C->getZExtValue() == 0) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

bool ReachabilityAnalysis::containsUnlockOperation(llvm::BasicBlock* BB) const {
    for (auto& I : *BB) {
        if (auto* CI = llvm::dyn_cast<llvm::CallInst>(&I)) {
            llvm::Function* F = CI->getCalledFunction();
            if (F && F->hasName()) {
                llvm::StringRef name = F->getName();
                if (name.contains("unlock") || name.contains("release") || 
                    name.contains("unref") || name.contains("put")) {
                    return true;
                }
            }
        }
    }
    return false;
}

bool ReachabilityAnalysis::containsFreeOperation(llvm::BasicBlock* BB) const {
    for (auto& I : *BB) {
        if (auto* CI = llvm::dyn_cast<llvm::CallInst>(&I)) {
            llvm::Function* F = CI->getCalledFunction();
            if (AnalysisEngine::isFreeFunction(F)) {
                return true;
            }
        }
    }
    return false;
}

bool ReachabilityAnalysis::isGotoErrorPattern(llvm::BasicBlock* BB) const {
    if (BB->hasName()) {
        std::string name = BB->getName().str();
        if (name == "error" || name == "err" || 
            name.find("error_") == 0 || name.find("err_") == 0 ||
            name.find("_error") != std::string::npos || name.find("_err") != std::string::npos) {
            return true;
        }
    }
    return false;
}

bool ReachabilityAnalysis::isReturnErrorPattern(llvm::BasicBlock* BB) const {
    bool hasReturn = false;
    bool returnsErrorCode = false;
    
    for (auto& I : *BB) {
        if (auto* RI = llvm::dyn_cast<llvm::ReturnInst>(&I)) {
            hasReturn = true;
            if (RI->getNumOperands() > 0) {
                llvm::Value* retVal = RI->getReturnValue();
                if (auto* C = llvm::dyn_cast<llvm::ConstantInt>(retVal)) {
                    if (C->isNegative() || C->getZExtValue() == 0) {
                        returnsErrorCode = true;
                    }
                }
            }
        }
    }
    
    return hasReturn && (returnsErrorCode || containsFreeOperation(BB) || 
           containsUnlockOperation(BB) || containsErrorCall(BB));
}

bool ReachabilityAnalysis::analyzeBlockPattern(llvm::BasicBlock* BB, ErrorHandlerInfo& info) const {
    if (isGotoErrorPattern(BB)) {
        info.type = ErrorHandlerType::GOTO_ERROR;
        info.isErrorHandler = true;
        return true;
    }
    
    if (isReturnErrorPattern(BB)) {
        info.type = classifyErrorHandler(BB);
        info.isErrorHandler = true;
        return true;
    }
    
    if (containsFreeOperation(BB) && containsUnlockOperation(BB)) {
        info.type = ErrorHandlerType::FREE_AND_RETURN;
        info.isErrorHandler = true;
        return true;
    }
    
    if (containsErrorCall(BB)) {
        info.type = ErrorHandlerType::LOG_AND_RETURN;
        info.isErrorHandler = true;
        return true;
    }
    
    return false;
}

void ReachabilityAnalysis::identifyErrorHandlers() {
    errorHandlers.clear();
    
    llvm::DominatorTree DT(function);
    
    for (auto& BB : function) {
        ErrorHandlerInfo info;
        info.block = &BB;
        info.isReachable = reachableBlocks.count(&BB);
        info.isErrorHandler = false;
        info.type = ErrorHandlerType::NONE;
        
        if (BB.hasName()) {
            info.errorLabel = BB.getName().str();
        }
        
        analyzeBlockPattern(&BB, info);
        
        if (info.isErrorHandler) {
            for (auto* DomBB : DT) {
                if (DT.dominates(&BB, DomBB) && &BB != DomBB) {
                    info.dominatedBlocks.push_back(DomBB);
                }
            }
        }
        
        errorHandlers[&BB] = info;
    }
    
    for (auto it = pred_begin(&function.front()), ie = pred_end(&function.front()); it != ie; ++it) {
    }
    
    for (auto& BB : function) {
        auto* term = BB.getTerminator();
        for (unsigned i = 0; i < term->getNumSuccessors(); ++i) {
            llvm::BasicBlock* succ = term->getSuccessor(i);
            auto it = errorHandlers.find(succ);
            if (it != errorHandlers.end() && it->second.isErrorHandler) {
                if (auto* BR = llvm::dyn_cast<llvm::BranchInst>(term)) {
                    if (BR->isConditional()) {
                    }
                }
            }
        }
    }
}

void ReachabilityAnalysis::propagateReachability() {
    std::queue<llvm::BasicBlock*> worklist;
    
    for (auto* BB : reachableBlocks) {
        worklist.push(BB);
    }
    
    while (!worklist.empty()) {
        llvm::BasicBlock* BB = worklist.front();
        worklist.pop();
        
        auto term = BB->getTerminator();
        for (unsigned i = 0; i < term->getNumSuccessors(); ++i) {
            llvm::BasicBlock* succ = term->getSuccessor(i);
            
            if (auto* BR = llvm::dyn_cast<llvm::BranchInst>(term)) {
                if (BR->isConditional()) {
                    llvm::Value* cond = BR->getCondition();
                    if (auto* C = llvm::dyn_cast<llvm::ConstantInt>(cond)) {
                        if (C->isOne() && i == 1) continue;
                        if (C->isZero() && i == 0) continue;
                    }
                }
            }
            
            if (unreachableBlocks.count(succ)) {
                unreachableBlocks.erase(succ);
                reachableBlocks.insert(succ);
                worklist.push(succ);
            }
        }
    }
    
    for (auto& [BB, info] : errorHandlers) {
        info.isReachable = reachableBlocks.count(BB);
    }
}

void ReachabilityAnalysis::analyze() {
    computeReachability();
    identifyErrorHandlers();
    propagateReachability();
}

llvm::SmallVector<llvm::BasicBlock*, 16> ReachabilityAnalysis::getUnreachableErrorHandlers() const {
    llvm::SmallVector<llvm::BasicBlock*, 16> result;
    
    for (const auto& [BB, info] : errorHandlers) {
        if (info.isErrorHandler && !info.isReachable) {
            result.push_back(BB);
        }
    }
    
    return result;
}

bool ReachabilityAnalysis::isErrorHandlingPattern(llvm::BasicBlock* BB) const {
    auto it = errorHandlers.find(BB);
    return it != errorHandlers.end() && it->second.isErrorHandler;
}

bool DeadErrorCodeDetector::isConstantFalseCondition(llvm::Value* cond) const {
    if (auto* C = llvm::dyn_cast<llvm::ConstantInt>(cond)) {
        return C->isZero();
    }
    return false;
}

bool DeadErrorCodeDetector::isConditionAlwaysFalse(llvm::BranchInst* BR) const {
    if (!BR || !BR->isConditional()) return false;
    return isConstantFalseCondition(BR->getCondition());
}

bool DeadErrorCodeDetector::isTrueUnreachable(llvm::BasicBlock* BB, 
                                            const ReachabilityAnalysis& RA,
                                            llvm::DominatorTree& DT) const {
    if (RA.isReachable(BB)) return false;
    
    for (auto it = pred_begin(BB), ie = pred_end(BB); it != ie; ++it) {
        llvm::BasicBlock* pred = *it;
        auto* term = pred->getTerminator();
        
        if (auto* BR = llvm::dyn_cast<llvm::BranchInst>(term)) {
            if (BR->isConditional()) {
                if (!isConstantFalseCondition(BR->getCondition())) {
                    return false;
                }
            }
        } else if (auto* SW = llvm::dyn_cast<llvm::SwitchInst>(term)) {
            bool isDefault = false;
            for (auto& Case : SW->cases()) {
                if (Case.getCaseSuccessor() == BB) {
                    isDefault = false;
                    break;
                }
            }
            if (SW->getDefaultDest() == BB) {
                isDefault = true;
            }
            if (!isDefault) {
                if (auto* CI = llvm::dyn_cast<llvm::ConstantInt>(SW->getCondition())) {
                    for (auto& Case : SW->cases()) {
                        if (Case.getCaseValue() == CI && Case.getCaseSuccessor() == BB) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    
    return true;
}

void DeadErrorCodeDetector::reportUnreachableErrorHandler(const ErrorHandlerInfo& info, llvm::Function& F) {
    Issue issue;
    issue.type = IssueType::UNREACHABLE_ERROR_HANDLER;
    issue.function = F.getName().str();
    
    std::string typeStr;
    switch (info.type) {
        case ErrorHandlerType::GOTO_ERROR:
            typeStr = "goto error label";
            break;
        case ErrorHandlerType::IF_ERROR_THEN:
            typeStr = "if-error-then block";
            break;
        case ErrorHandlerType::FREE_AND_RETURN:
            typeStr = "cleanup and return";
            break;
        case ErrorHandlerType::LOG_AND_RETURN:
            typeStr = "log and return";
            break;
        case ErrorHandlerType::UNLOCK_AND_RETURN:
            typeStr = "unlock and return";
            break;
        default:
            typeStr = "error handling";
    }
    
    issue.description = "Unreachable " + typeStr + " code detected";
    
    if (!info.errorLabel.empty()) {
        issue.description += " (label: " + info.errorLabel + ")";
    }
    
    for (auto& I : *info.block) {
        if (auto& DL = I.getDebugLoc()) {
            auto* scope = llvm::dyn_cast<llvm::DIScope>(DL.getScope());
            if (scope) {
                issue.filename = scope->getFilename().str();
            }
            issue.line = DL.getLine();
            issue.column = DL.getCol();
            break;
        }
    }
    
    engine.addIssue(issue);
}

void DeadErrorCodeDetector::reportDeadErrorPath(llvm::BasicBlock* source, llvm::BasicBlock* handler, llvm::Function& F) {
    Issue issue;
    issue.type = IssueType::DEAD_ERROR_CODE;
    issue.function = F.getName().str();
    issue.description = "Dead error handling path: the error condition is always false";
    
    for (auto& I : *source) {
        if (auto* BR = llvm::dyn_cast<llvm::BranchInst>(&I)) {
            if (BR->isConditional()) {
                if (auto& DL = BR->getDebugLoc()) {
                    auto* scope = llvm::dyn_cast<llvm::DIScope>(DL.getScope());
                    if (scope) {
                        issue.filename = scope->getFilename().str();
                    }
                    issue.line = DL.getLine();
                    issue.column = DL.getCol();
                    break;
                }
            }
        }
    }
    
    if (handler && handler->hasName()) {
        issue.variable = handler->getName().str();
    }
    
    engine.addIssue(issue);
}

void DeadErrorCodeDetector::detectInFunction(llvm::Function& F) {
    if (!engine.getConfig().checks.enableUnreachableCode ||
        !engine.getConfig().checks.enableReachabilityAnalysis) {
        return;
    }
    
    ReachabilityAnalysis RA(F);
    RA.analyze();
    
    auto unreachableHandlers = RA.getUnreachableErrorHandlers();
    for (auto* BB : unreachableHandlers) {
        const ErrorHandlerInfo* info = RA.getErrorHandlerInfo(BB);
        if (info) {
            reportUnreachableErrorHandler(*info, F);
        }
    }
    
    llvm::DominatorTree DT(F);
    
    for (auto& BB : F) {
        auto* term = BB.getTerminator();
        if (auto* BR = llvm::dyn_cast<llvm::BranchInst>(term)) {
            if (BR->isConditional()) {
                for (unsigned i = 0; i < 2; ++i) {
                    llvm::BasicBlock* succ = BR->getSuccessor(i);
                    if (RA.isErrorHandler(succ) && !RA.isReachable(succ)) {
                        if (isTrueUnreachable(succ, RA, DT)) {
                            reportDeadErrorPath(&BB, succ, F);
                        }
                    }
                }
            }
        }
    }
}

} // namespace memsafety
