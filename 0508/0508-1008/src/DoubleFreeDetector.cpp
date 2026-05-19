#include "DoubleFreeDetector.h"
#include "llvm/IR/DebugInfoMetadata.h"

namespace memsafety {

llvm::Value* DoubleFreeDetector::getUnderlyingPointer(llvm::Value* val) {
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

std::string DoubleFreeDetector::getPointerName(llvm::Value* val) {
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

bool DoubleFreeDetector::isAlreadyFreed(llvm::Value* ptr, AbstractState& state) {
    ptr = getUnderlyingPointer(ptr);
    
    PointerState s = state.getState(ptr);
    if (s == PointerState::FREED) return true;
    
    auto it = state.pointers.find(ptr);
    if (it != state.pointers.end() && it->second.isFreed) {
        return true;
    }
    
    return false;
}

llvm::Instruction* DoubleFreeDetector::getFirstFreeSite(llvm::Value* ptr, AbstractState& state) {
    ptr = getUnderlyingPointer(ptr);
    auto it = state.pointers.find(ptr);
    if (it != state.pointers.end()) {
        return it->second.freeSite;
    }
    return nullptr;
}

void DoubleFreeDetector::checkFree(llvm::CallInst* CI, llvm::Value* ptr, AbstractState& state) {
    if (!ptr || !ptr->getType()->isPointerTy()) return;
    
    if (auto* C = llvm::dyn_cast<llvm::Constant>(ptr)) {
        if (C->isNullValue()) {
            return;
        }
    }
    
    llvm::Value* underlying = getUnderlyingPointer(ptr);
    
    if (isAlreadyFreed(underlying, state)) {
        Issue issue;
        issue.type = IssueType::DOUBLE_FREE;
        issue.variable = getPointerName(underlying);
        
        llvm::Instruction* firstFree = getFirstFreeSite(underlying, state);
        if (firstFree) {
            std::stringstream ss;
            ss << "Double free detected: memory was already freed at instruction ";
            if (firstFree->hasName()) {
                ss << firstFree->getName().str();
            }
            if (auto& freeDL = firstFree->getDebugLoc()) {
                ss << " (line " << freeDL.getLine() << ")";
            }
            ss << " and is being freed again here";
            issue.description = ss.str();
        } else {
            issue.description = "Double free detected: attempting to free memory that has already been freed";
        }
        
        if (auto& DL = CI->getDebugLoc()) {
            auto* scope = llvm::dyn_cast<llvm::DIScope>(DL.getScope());
            if (scope) {
                issue.filename = scope->getFilename().str();
                issue.function = scope->getName().str();
            }
            issue.line = DL.getLine();
            issue.column = DL.getCol();
        }
        
        if (auto* F = CI->getFunction()) {
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

} // namespace memsafety
