import { usePetStore } from '@/store/usePetStore';
import { determineMood } from '@/utils/petUtils';
import { PetMood, PetType } from '@/types/pet';

interface PixelPetProps {
  className?: string;
}

const PixelPet = ({ className = '' }: PixelPetProps) => {
  const { pet, floatingText } = usePetStore();
  const mood = determineMood(pet);

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {floatingText && (
        <div
          key={floatingText.id}
          className="absolute -top-8 text-2xl font-bold text-amber-500 animate-float-up"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          {floatingText.text}
        </div>
      )}
      
      <div className="relative">
        <PixelCatDog type={pet.type} mood={mood} />
        
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/20 rounded-full blur-sm" />
      </div>
      
      <div className="mt-4 text-center">
        <span className="text-4xl animate-bounce">
          {mood === 'happy' && '😊'}
          {mood === 'normal' && '😐'}
          {mood === 'sad' && '😢'}
        </span>
        <p className="mt-2 text-xs text-gray-600 pixel-text">
          {pet.type === 'cat' ? '小猫咪' : '小狗狗'}
        </p>
      </div>
    </div>
  );
};

interface PixelCatDogProps {
  type: PetType;
  mood: PetMood;
}

const PixelCatDog = ({ type, mood }: PixelCatDogProps) => {
  if (type === 'cat') {
    return <PixelCat mood={mood} />;
  }
  return <PixelDog mood={mood} />;
};

const PixelCat = ({ mood }: { mood: PetMood }) => {
  const eyeColor = mood === 'sad' ? '#6B7280' : '#1F2937';
  const mouthColor = mood === 'sad' ? '#EF4444' : mood === 'happy' ? '#10B981' : '#1F2937';
  
  return (
    <div className="relative" style={{ width: '160px', height: '160px' }}>
      <svg viewBox="0 0 32 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <rect x="6" y="4" width="4" height="4" fill="#F59E0B" />
        <rect x="22" y="4" width="4" height="4" fill="#F59E0B" />
        <rect x="8" y="6" width="8" height="4" fill="#F59E0B" />
        <rect x="16" y="6" width="8" height="4" fill="#F59E0B" />
        
        <rect x="4" y="8" width="24" height="4" fill="#F59E0B" />
        <rect x="2" y="12" width="28" height="8" fill="#F59E0B" />
        <rect x="4" y="20" width="24" height="4" fill="#F59E0B" />
        <rect x="6" y="24" width="8" height="4" fill="#F59E0B" />
        <rect x="18" y="24" width="8" height="4" fill="#F59E0B" />
        
        <rect x="10" y="12" width="4" height="4" fill="#FBBF24" />
        <rect x="18" y="12" width="4" height="4" fill="#FBBF24" />
        
        <rect x="10" y="14" width="4" height="4" fill={eyeColor} />
        <rect x="18" y="14" width="4" height="4" fill={eyeColor} />
        
        {mood === 'happy' && (
          <>
            <rect x="11" y="15" width="2" height="2" fill="white" />
            <rect x="19" y="15" width="2" height="2" fill="white" />
          </>
        )}
        
        {mood === 'sad' && (
          <>
            <rect x="10" y="13" width="4" height="1" fill={eyeColor} />
            <rect x="18" y="13" width="4" height="1" fill={eyeColor} />
            <rect x="12" y="17" width="1" height="2" fill="#60A5FA" />
            <rect x="20" y="17" width="1" height="2" fill="#60A5FA" />
          </>
        )}
        
        <rect x="15" y="17" width="2" height="2" fill="#EC4899" />
        
        {mood === 'happy' && (
          <>
            <rect x="13" y="19" width="1" height="1" fill={mouthColor} />
            <rect x="14" y="20" width="2" height="1" fill={mouthColor} />
            <rect x="17" y="19" width="1" height="1" fill={mouthColor} />
          </>
        )}
        {mood === 'normal' && (
          <rect x="13" y="19" width="6" height="1" fill={mouthColor} />
        )}
        {mood === 'sad' && (
          <>
            <rect x="13" y="20" width="1" height="1" fill={mouthColor} />
            <rect x="14" y="19" width="4" height="1" fill={mouthColor} />
            <rect x="18" y="20" width="1" height="1" fill={mouthColor} />
          </>
        )}
        
        <rect x="4" y="16" width="3" height="1" fill="#FCD34D" />
        <rect x="25" y="16" width="3" height="1" fill="#FCD34D" />
        <rect x="4" y="18" width="3" height="1" fill="#FCD34D" />
        <rect x="25" y="18" width="3" height="1" fill="#FCD34D" />
      </svg>
    </div>
  );
};

const PixelDog = ({ mood }: { mood: PetMood }) => {
  const eyeColor = mood === 'sad' ? '#6B7280' : '#1F2937';
  const mouthColor = mood === 'sad' ? '#EF4444' : mood === 'happy' ? '#10B981' : '#1F2937';
  
  return (
    <div className="relative" style={{ width: '160px', height: '160px' }}>
      <svg viewBox="0 0 32 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <rect x="2" y="6" width="6" height="8" fill="#92400E" />
        <rect x="24" y="6" width="6" height="8" fill="#92400E" />
        <rect x="4" y="4" width="4" height="2" fill="#78350F" />
        <rect x="24" y="4" width="4" height="2" fill="#78350F" />
        
        <rect x="6" y="8" width="20" height="4" fill="#D97706" />
        <rect x="4" y="12" width="24" height="8" fill="#D97706" />
        <rect x="6" y="20" width="20" height="4" fill="#D97706" />
        <rect x="8" y="24" width="6" height="4" fill="#D97706" />
        <rect x="18" y="24" width="6" height="4" fill="#D97706" />
        
        <rect x="10" y="12" width="4" height="4" fill="#FCD34D" />
        <rect x="18" y="12" width="4" height="4" fill="#FCD34D" />
        
        <rect x="10" y="14" width="4" height="4" fill={eyeColor} />
        <rect x="18" y="14" width="4" height="4" fill={eyeColor} />
        
        {mood === 'happy' && (
          <>
            <rect x="11" y="15" width="2" height="2" fill="white" />
            <rect x="19" y="15" width="2" height="2" fill="white" />
          </>
        )}
        
        {mood === 'sad' && (
          <>
            <rect x="10" y="13" width="4" height="1" fill={eyeColor} />
            <rect x="18" y="13" width="4" height="1" fill={eyeColor} />
            <rect x="12" y="17" width="1" height="2" fill="#60A5FA" />
            <rect x="20" y="17" width="1" height="2" fill="#60A5FA" />
          </>
        )}
        
        <rect x="14" y="17" width="4" height="3" fill="#1F2937" />
        <rect x="15" y="18" width="2" height="1" fill="#374151" />
        
        {mood === 'happy' && (
          <>
            <rect x="12" y="20" width="1" height="1" fill={mouthColor} />
            <rect x="13" y="21" width="6" height="1" fill={mouthColor} />
            <rect x="19" y="20" width="1" height="1" fill={mouthColor} />
            <rect x="15" y="20" width="2" height="1" fill="#EF4444" />
          </>
        )}
        {mood === 'normal' && (
          <>
            <rect x="13" y="21" width="6" height="1" fill={mouthColor} />
            <rect x="15" y="20" width="2" height="1" fill="#EF4444" />
          </>
        )}
        {mood === 'sad' && (
          <>
            <rect x="13" y="22" width="1" height="1" fill={mouthColor} />
            <rect x="14" y="21" width="4" height="1" fill={mouthColor} />
            <rect x="18" y="22" width="1" height="1" fill={mouthColor} />
          </>
        )}
      </svg>
    </div>
  );
};

export default PixelPet;
