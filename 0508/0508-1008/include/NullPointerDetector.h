#ifndef MEMSAFETY_NULLPOINTERDETECTOR_H
#define MEMSAFETY_NULLPOINTERDETECTOR_H

#include "Common.h"
#include "AnalysisEngine.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/Value.h"
#include "llvm/Support/raw_ostream.h"

namespace memsafety {

class NullPointerDetector {
public:
    NullPointerDetector(AnalysisEngine& engine) : engine(engine) {}
    
    void checkDereference(llvm::Value* ptr, llvm::Instruction* I, 
                          AbstractState& state);
    
    void checkFunctionPointerCall(llvm::CallInst* CI, AbstractState& state);
    
    void checkArrayAccess(llvm::GetElementPtrInst* GEP, AbstractState& state);

private:
    AnalysisEngine& engine;
    
    bool isDefiniteNull(llvm::Value* ptr, AbstractState& state);
    bool isMaybeNull(llvm::Value* ptr, AbstractState& state);
    
    llvm::Value* getUnderlyingPointer(llvm::Value* val);
    std::string getPointerName(llvm::Value* val);
};

} // namespace memsafety

#endif // MEMSAFETY_NULLPOINTERDETECTOR_H
