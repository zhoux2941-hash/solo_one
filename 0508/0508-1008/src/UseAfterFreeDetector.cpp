#include "UseAfterFreeDetector.h"
#include "llvm/IR/DebugInfoMetadata.h"

namespace memsafety {

llvm::Value* UseAfterFreeDetector::getUnderlyingPointer(llvm::Value* val) {
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

std::string UseAfterFreeDetector::getPointerName(llvm::Value* val) {
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

bool UseAfterFreeDetector::isFreed(llvm::Value* ptr, AbstractState& state) {
    ptr = getUnderlyingPointer(ptr);
    
    PointerState s = state.getState(ptr);
    if (s == PointerState::FREED) return true;
    
    auto it = state.pointers.find(ptr);
    if (it != state.pointers.end() && it->second.isFreed) {
        return true;
    }
    
    return false;
}

llvm::Instruction* UseAfterFreeDetector::getFreeSite(llvm::Value* ptr, AbstractState& state) {
    ptr = getUnderlyingPointer(ptr);
    auto it = state.pointers.find(ptr);
    if (it != state.pointers.end()) {
        return it->second.freeSite;
    }
    return nullptr;
}

void UseAfterFreeDetector::checkUse(llvm::Value* ptr, llvm::Instruction* I, AbstractState& state) {
    if (!ptr || !ptr->getType()->isPointerTy()) return;
    
    llvm::Value* underlying = getUnderlyingPointer(ptr);
    
    if (isFreed(underlying, state)) {
        Issue issue;
        issue.type = IssueType::USE_AFTER_FREE;
        issue.variable = getPointerName(underlying);
        
        llvm::Instruction* freeInst = getFreeSite(underlying, state);
        if (freeInst) {
            std::stringstream ss;
            ss << "Use after free detected: memory was freed at instruction ";
            if (freeInst->hasName()) {
                ss << freeInst->getName().str();
            } else {
                ss << "at position";
            }
            if (auto& freeDL = freeInst->getDebugLoc()) {
                ss << " (line " << freeDL.getLine() << ")";
            }
            ss << " and is being accessed here";
            issue.description = ss.str();
        } else {
            issue.description = "Use after free detected: accessing memory that has been freed";
        }
        
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
        
        for (auto* inst : state.trace) {
            if (auto& tDL = inst->getDebugLoc()) {
                auto* tScope = llvm::dyn_cast<llvm::DIScope>(tDL.getScope());
                std::string fname = tScope ? tScope->getFilename().str() : "unknown";
                issue.trace.push_back({fname, tDL.getLine()});
            }
        }
        
        engine.addIssue(issue);
    }
}

void UseAfterFreeDetector::checkStore(llvm::StoreInst* SI, AbstractState& state) {
    llvm::Value* ptr = SI->getPointerOperand();
    checkUse(ptr, SI, state);
    
    llvm::Value* val = SI->getValueOperand();
    if (val->getType()->isPointerTy()) {
        val = val->stripPointerCasts();
        auto it = state.pointers.find(val);
        if (it != state.pointers.end() && it->second.isFreed) {
            checkUse(val, SI, state);
        }
    }
}

void UseAfterFreeDetector::checkLoad(llvm::LoadInst* LI, AbstractState& state) {
    llvm::Value* ptr = LI->getPointerOperand();
    checkUse(ptr, LI, state);
}

void UseAfterFreeDetector::checkCall(llvm::CallInst* CI, AbstractState& state) {
    for (unsigned i = 0; i < CI->arg_size(); ++i) {
        llvm::Value* arg = CI->getArgOperand(i);
        if (arg->getType()->isPointerTy()) {
            checkUse(arg, CI, state);
        }
    }
}

void UseAfterFreeDetector::checkGEP(llvm::GetElementPtrInst* GEP, AbstractState& state) {
    llvm::Value* ptr = GEP->getPointerOperand();
    checkUse(ptr, GEP, state);
}

} // namespace memsafety
