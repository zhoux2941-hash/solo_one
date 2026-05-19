#include "MemoryLeakDetector.h"
#include "llvm/IR/DebugInfoMetadata.h"
#include "llvm/IR/InstIterator.h"
#include "llvm/IR/GlobalVariable.h"

namespace memsafety {

llvm::Value* MemoryLeakDetector::getUnderlyingPointer(llvm::Value* val) {
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

std::string MemoryLeakDetector::getPointerName(llvm::Value* val) {
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

void MemoryLeakDetector::trackAllocation(llvm::CallInst* CI) {
    AllocationInfo info;
    info.allocation = CI;
    info.allocSite = CI;
    info.isFreed = false;
    info.isReturned = false;
    info.isStoredGlobally = false;
    info.isPassedToFunction = false;
    allocations[CI] = info;
}

void MemoryLeakDetector::trackFree(llvm::CallInst* CI) {
    if (CI->arg_size() == 0) return;
    
    llvm::Value* ptr = CI->getArgOperand(0);
    ptr = getUnderlyingPointer(ptr);
    
    freedPointers.insert(ptr);
    
    for (auto& [allocVal, info] : allocations) {
        if (allocVal == ptr || info.storedTo == ptr) {
            info.isFreed = true;
        }
    }
}

void MemoryLeakDetector::trackStore(llvm::StoreInst* SI) {
    llvm::Value* val = SI->getValueOperand();
    llvm::Value* ptr = SI->getPointerOperand();
    
    val = val->stripPointerCasts();
    ptr = ptr->stripPointerCasts();
    
    if (allocations.count(val)) {
        allocations[val].storedTo = ptr;
        
        if (llvm::isa<llvm::GlobalVariable>(ptr)) {
            allocations[val].isStoredGlobally = true;
        }
    }
}

void MemoryLeakDetector::trackReturn(llvm::ReturnInst* RI) {
    if (RI->getNumOperands() == 0) return;
    
    llvm::Value* retVal = RI->getReturnValue();
    if (!retVal) return;
    
    retVal = retVal->stripPointerCasts();
    
    auto it = allocations.find(retVal);
    if (it != allocations.end()) {
        it->second.isReturned = true;
    }
    
    for (auto& [allocVal, info] : allocations) {
        if (info.storedTo == retVal) {
            info.isReturned = true;
        }
    }
}

void MemoryLeakDetector::trackCallArgument(llvm::CallInst* CI) {
    for (unsigned i = 0; i < CI->arg_size(); ++i) {
        llvm::Value* arg = CI->getArgOperand(i);
        arg = arg->stripPointerCasts();
        
        auto it = allocations.find(arg);
        if (it != allocations.end()) {
            llvm::Function* F = CI->getCalledFunction();
            if (F && F->isDeclaration()) {
                it->second.isPassedToFunction = true;
            }
        }
        
        for (auto& [allocVal, info] : allocations) {
            if (info.storedTo == arg) {
                llvm::Function* F = CI->getCalledFunction();
                if (F && F->isDeclaration()) {
                    info.isPassedToFunction = true;
                }
            }
        }
    }
}

bool MemoryLeakDetector::isPointerEscaped(llvm::Value* ptr, llvm::Function& F) {
    auto it = allocations.find(ptr);
    if (it == allocations.end()) return false;
    
    const AllocationInfo& info = it->second;
    
    if (info.isReturned) return true;
    if (info.isStoredGlobally) return true;
    if (info.isPassedToFunction) return true;
    
    return false;
}

bool MemoryLeakDetector::isStoredToGlobal(llvm::Value* ptr) {
    auto it = allocations.find(ptr);
    if (it != allocations.end()) {
        return it->second.isStoredGlobally;
    }
    return false;
}

bool MemoryLeakDetector::isPassedToExternalFunction(llvm::Value* ptr) {
    auto it = allocations.find(ptr);
    if (it != allocations.end()) {
        return it->second.isPassedToFunction;
    }
    return false;
}

void MemoryLeakDetector::analyzeFunction(llvm::Function& F) {
    allocations.clear();
    freedPointers.clear();
    
    for (auto& BB : F) {
        for (auto& I : BB) {
            if (auto* CI = llvm::dyn_cast<llvm::CallInst>(&I)) {
                llvm::Function* calledF = CI->getCalledFunction();
                
                if (AnalysisEngine::isAllocationFunction(calledF)) {
                    trackAllocation(CI);
                } else if (AnalysisEngine::isFreeFunction(calledF)) {
                    trackFree(CI);
                } else {
                    trackCallArgument(CI);
                }
            } else if (auto* SI = llvm::dyn_cast<llvm::StoreInst>(&I)) {
                trackStore(SI);
            } else if (auto* RI = llvm::dyn_cast<llvm::ReturnInst>(&I)) {
                trackReturn(RI);
            }
        }
    }
}

void MemoryLeakDetector::checkLeaks(llvm::Function& F) {
    for (auto& [allocVal, info] : allocations) {
        if (!info.isFreed && !isPointerEscaped(allocVal, F)) {
            Issue issue;
            issue.type = IssueType::MEMORY_LEAK;
            issue.variable = getPointerName(allocVal);
            issue.description = "Memory leak detected: allocated memory is not freed before function returns";
            
            if (auto* inst = llvm::dyn_cast<llvm::Instruction>(allocVal)) {
                if (auto& DL = inst->getDebugLoc()) {
                    auto* scope = llvm::dyn_cast<llvm::DIScope>(DL.getScope());
                    if (scope) {
                        issue.filename = scope->getFilename().str();
                        issue.function = scope->getName().str();
                    }
                    issue.line = DL.getLine();
                    issue.column = DL.getCol();
                }
            }
            
            issue.function = F.getName().str();
            
            engine.addIssue(issue);
        }
    }
}

} // namespace memsafety
