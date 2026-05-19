#ifndef MEMSAFETY_USEAFTERFREEDETECTOR_H
#define MEMSAFETY_USEAFTERFREEDETECTOR_H

#include "Common.h"
#include "AnalysisEngine.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/Value.h"
#include "llvm/Support/raw_ostream.h"

namespace memsafety {

class UseAfterFreeDetector {
public:
    UseAfterFreeDetector(AnalysisEngine& engine) : engine(engine) {}
    
    void checkUse(llvm::Value* ptr, llvm::Instruction* I, AbstractState& state);
    
    void checkStore(llvm::StoreInst* SI, AbstractState& state);
    void checkLoad(llvm::LoadInst* LI, AbstractState& state);
    void checkCall(llvm::CallInst* CI, AbstractState& state);
    void checkGEP(llvm::GetElementPtrInst* GEP, AbstractState& state);

private:
    AnalysisEngine& engine;
    
    bool isFreed(llvm::Value* ptr, AbstractState& state);
    llvm::Value* getUnderlyingPointer(llvm::Value* val);
    std::string getPointerName(llvm::Value* val);
    llvm::Instruction* getFreeSite(llvm::Value* ptr, AbstractState& state);
};

} // namespace memsafety

#endif // MEMSAFETY_USEAFTERFREEDETECTOR_H
