#ifndef MEMSAFETY_MEMORYLEAKDETECTOR_H
#define MEMSAFETY_MEMORYLEAKDETECTOR_H

#include "Common.h"
#include "AnalysisEngine.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/Value.h"
#include "llvm/IR/Function.h"
#include "llvm/Support/raw_ostream.h"
#include <set>
#include <map>

namespace memsafety {

struct AllocationInfo {
    llvm::Value* allocation;
    llvm::Instruction* allocSite;
    llvm::Value* storedTo;
    bool isFreed = false;
    bool isReturned = false;
    bool isStoredGlobally = false;
    bool isPassedToFunction = false;
};

class MemoryLeakDetector {
public:
    MemoryLeakDetector(AnalysisEngine& engine) : engine(engine) {}
    
    void analyzeFunction(llvm::Function& F);
    void checkLeaks(llvm::Function& F);

private:
    AnalysisEngine& engine;
    
    std::map<llvm::Value*, AllocationInfo> allocations;
    std::set<llvm::Value*> freedPointers;
    
    void trackAllocation(llvm::CallInst* CI);
    void trackFree(llvm::CallInst* CI);
    void trackStore(llvm::StoreInst* SI);
    void trackReturn(llvm::ReturnInst* RI);
    void trackCallArgument(llvm::CallInst* CI);
    
    bool isPointerEscaped(llvm::Value* ptr, llvm::Function& F);
    bool isStoredToGlobal(llvm::Value* ptr);
    bool isPassedToExternalFunction(llvm::Value* ptr);
    
    llvm::Value* getUnderlyingPointer(llvm::Value* val);
    std::string getPointerName(llvm::Value* val);
};

} // namespace memsafety

#endif // MEMSAFETY_MEMORYLEAKDETECTOR_H
