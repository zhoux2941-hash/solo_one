import React, { useState } from 'react';
import CharacterSelector from './components/CharacterSelector';
import CopybookGenerator from './components/CopybookGenerator';
import PracticeEvaluator from './components/PracticeEvaluator';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('selector');
  const [selectedFont, setSelectedFont] = useState('楷体');
  const [selectedCharacter, setSelectedCharacter] = useState('');

  const handleCharacterSelect = (character, font) => {
    setSelectedCharacter(character);
    setSelectedFont(font);
  };

  return (
    <div className="App">
      <header className="header">
        <h1>汉字描红练习</h1>
        <p>选择字体和汉字，生成字帖，拍照上传临摹作品，获取评分反馈</p>
      </header>

      <main className="main-content">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'selector' ? 'active' : ''}`}
            onClick={() => setActiveTab('selector')}
          >
            选择汉字
          </button>
          <button
            className={`tab ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            生成字帖
          </button>
          <button
            className={`tab ${activeTab === 'evaluate' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluate')}
          >
            评分对比
          </button>
        </div>

        {activeTab === 'selector' && (
          <CharacterSelector
            onSelect={handleCharacterSelect}
          />
        )}

        {activeTab === 'generator' && (
          <CopybookGenerator
            defaultFont={selectedFont}
            defaultCharacters={selectedCharacter}
          />
        )}

        {activeTab === 'evaluate' && (
          <PracticeEvaluator
            referenceCharacter={selectedCharacter}
            referenceFont={selectedFont}
          />
        )}
      </main>
    </div>
  );
}

export default App;
