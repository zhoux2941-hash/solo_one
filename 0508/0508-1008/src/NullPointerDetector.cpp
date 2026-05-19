#include "NullPointerDetector.h"
#include "llvm/IR/DebugInfoMetadata.h"

namespace memsafety {

llvm::Value* NullPointerDetector::getUnderlyingPointer(llvm::Value* val) {
    if (!val) return nullptr;
    
    while (true) {
        if (auto* bitcast = llvm::dyn_cast<llvm::BitCastInst>(val)) {
            val = bitcast->getOperand(0);
        } else if (auto* gep = llvm::dyn_cast<llvm::GetElementPtrInst>(val)) {
            val = gep->getPointerOperand();
        } else if (auto* load = llvm::dyn_cast<llvm::LoadInst>(val)) {
            val = load->getPointerOperand();
        } else {
            break;
        }
    }
    return val->stripPointerCasts();
}

std::string NullPointerDetector::getPointerName(llvm::Value* val) {
    if (!val) return "unknown";
    
    if (val->hasName()) {
        return val->getName().str();
    }
    
    if (auto* arg = llvm::dyn_cast<llvm::Argument>(val)) {
        if (arg->hasName()) {
            return arg->getName().str();
        }
        return "argument_" + std::to_string(arg->getArgNo());
    }
    
    if (auto* inst = llvm::dyn_cast<llvm::Instruction>(val)) {
        if (inst->hasName()) {
            return inst->getName().str();
        }
        return "instruction";
    }
    
    return "anonymous";
}

bool NullPointerDetector::isDefiniteNull(llvm::Value* ptr, AbstractState& state) {
    ptr = getUnderlyingPointer(ptr);
    
    if (auto* C = llvm::dyn_cast<llvm::Constant>(ptr)) {
        if (C->isNullValue()) return true;
    }
    
    PointerState s = state.getState(ptr);
    if (s == PointerState::DEFINITELY_NULL) return true;
    
    if (state.pathCond.impliesNull(ptr)) return true;
    
    return false;
}

bool NullPointerDetector::isMaybeNull(llvm::Value* ptr, AbstractState& state) {
    ptr = getUnderlyingPointer(ptr);
    
    if (auto* C = llvm::dyn_cast<llvm::Constant>(ptr)) {
        if (C->isNullValue()) return true;
    }
    
    PointerState s = state.getState(ptr);
    if (s == PointerState::DEFINITELY_NULL || s == PointerState::MAYBE_NULL) {
        return true;
    }
    
    return false;
}

void NullPointerDetector::checkDereference(llvm::Value* ptr, llvm::Instruction* I, 
                                           AbstractState& state) {
    if (!ptr || !ptr->getType()->isPointerTy()) return;
    
    llvm::Value* underlying = getUnderlyingPointer(ptr);
    
    if (isDefiniteNull(underlying, state)) {
        Issue issue;
        issue.type = IssueType::NULL_POINTER_DEREF;
        issue.variable = getPointerName(underlying);
        issue.description = "Definite null pointer dereference detected";
        
        if (auto& DL = I->getDebugLoc()) {
            auto* scope = llvm::dyn_cast<llvm::DIScope>(DL.getScope());
            if (scope) {
                issue.filename = scope->getFilename().str();
                issue.function = scope->getName().str();
            }
            issue.line = DL.getLine();
            issue.column = DL.getCol();
        }
        
        if (auto* F = I->getFunction()) {
            issue.function = F->getName().str();
        }
        
        engine.addIssue(issue);
    } else if (isMaybeNull(underlying, state) && !state.pathCond.impliesNotNull(underlying)) {
        Issue issue;
        issue.type = IssueType::NULL_POINTER_DEREF;
        issue.variable = getPointerName(underlying);
        issue.description = "Potential null pointer dereference detected";
        
        if (auto& DL = I->getDebugLoc()) {
            auto* scope = llvm::dyn_cast<llvm::DIScope>(DL.getScope());
            if (scope) {
                issue.filename = scope->getFilename().str();
                issue.function = scope->getName().str();
            }
            issue.line = DL.getLine();
            issue.column = DL.getCol();
        }
        
        if (auto* F = I->getFunction()) {
            issue.function = F->getName().str();
        }
        
        engine.addIssue(issue);
    }
}

void NullPointerDetector::checkFunctionPointerCall(llvm::CallInst* CI, AbstractState& state) {
    llvm::Value* calledVal = CI->getCalledOperand();
    checkDereference(calledVal, CI, state);
}

void NullPointerDetector::checkArrayAccess(llvm::GetElementPtrInst* GEP, AbstractState& state) {
    llvm::Value* ptr = GEP->getPointerOperand();
    checkDereference(ptr, GEP, state);
}

} // namespace memsafety
