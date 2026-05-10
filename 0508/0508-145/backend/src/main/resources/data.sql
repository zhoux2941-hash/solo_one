USE opera_mask;

INSERT INTO mask_template (name, description, type, svg_content, regions, is_default) VALUES 
(
    '经典京剧脸谱',
    '传统京剧脸谱模板，包含额头、左右眼眶、左右脸颊等主要分区',
    'default',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="faceGradient" cx="50%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:#F5DEB3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#DEB887;stop-opacity:1" />
    </radialGradient>
  </defs>
  <ellipse id="face" cx="200" cy="250" rx="140" ry="180" fill="url(#faceGradient)" stroke="#333" stroke-width="2"/>
  <path id="forehead" d="M200 70 Q280 80 300 120 Q280 160 200 180 Q120 160 100 120 Q120 80 200 70" fill="#F5DEB3" stroke="#333" stroke-width="1.5"/>
  <ellipse id="left_eye_socket" cx="150" cy="200" rx="35" ry="25" fill="white" stroke="#333" stroke-width="2"/>
  <ellipse id="right_eye_socket" cx="250" cy="200" rx="35" ry="25" fill="white" stroke="#333" stroke-width="2"/>
  <ellipse id="left_cheek" cx="120" cy="280" rx="45" ry="55" fill="#F5DEB3" stroke="#333" stroke-width="1.5"/>
  <ellipse id="right_cheek" cx="280" cy="280" rx="45" ry="55" fill="#F5DEB3" stroke="#333" stroke-width="1.5"/>
  <path id="nose" d="M190 220 L210 220 L215 280 Q200 300 185 280 L190 220" fill="#DEB887" stroke="#333" stroke-width="1.5"/>
  <path id="mouth" d="M170 340 Q200 360 230 340 Q220 350 200 350 Q180 350 170 340" fill="#8B0000" stroke="#333" stroke-width="1.5"/>
  <path id="left_eyebrow" d="M130 160 Q150 150 175 160" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>
  <path id="right_eyebrow" d="M225 160 Q250 150 270 160" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>
</svg>',
    '[{"id":"forehead","name":"额头","x":140,"y":80,"width":120,"height":100,"defaultColor":"#F5DEB3"},{"id":"left_eye_socket","name":"左眼框","x":115,"y":175,"width":70,"height":50,"defaultColor":"#FFFFFF"},{"id":"right_eye_socket","name":"右眼框","x":215,"y":175,"width":70,"height":50,"defaultColor":"#FFFFFF"},{"id":"left_cheek","name":"左脸颊","x":75,"y":225,"width":90,"height":110,"defaultColor":"#F5DEB3"},{"id":"right_cheek","name":"右脸颊","x":235,"y":225,"width":90,"height":110,"defaultColor":"#F5DEB3"},{"id":"mouth","name":"嘴部","x":165,"y":335,"width":70,"height":30,"defaultColor":"#8B0000"},{"id":"face","name":"面部底色","x":60,"y":70,"width":280,"height":360,"defaultColor":"#F5DEB3"}]',
    1
),
(
    '关羽脸谱',
    '红脸关羽脸谱模板，以红色为主色调，象征忠义',
    'default',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="redFace" cx="50%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:#DC143C;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B0000;stop-opacity:1" />
    </radialGradient>
  </defs>
  <ellipse id="face" cx="200" cy="250" rx="140" ry="180" fill="url(#redFace)" stroke="#333" stroke-width="2"/>
  <path id="forehead" d="M200 70 Q280 80 300 120 Q280 160 200 180 Q120 160 100 120 Q120 80 200 70" fill="#DC143C" stroke="#333" stroke-width="1.5"/>
  <path id="left_eye_socket" d="M110 190 Q150 180 190 195 L190 215 Q150 230 110 220 L110 190" fill="black" stroke="#333" stroke-width="2"/>
  <path id="right_eye_socket" d="M210 195 Q250 180 290 190 L290 220 Q250 230 210 215 L210 195" fill="black" stroke="#333" stroke-width="2"/>
  <ellipse id="left_cheek" cx="120" cy="280" rx="45" ry="55" fill="#DC143C" stroke="#333" stroke-width="1.5"/>
  <ellipse id="right_cheek" cx="280" cy="280" rx="45" ry="55" fill="#DC143C" stroke="#333" stroke-width="1.5"/>
  <path id="nose" d="M190 220 L210 220 L215 280 Q200 300 185 280 L190 220" fill="#B22222" stroke="#333" stroke-width="1.5"/>
  <path id="mouth" d="M165 340 Q200 355 235 340 Q220 365 200 365 Q180 365 165 340" fill="#8B0000" stroke="#333" stroke-width="1.5"/>
  <path id="left_eyebrow" d="M120 150 Q160 130 180 155" fill="none" stroke="#333" stroke-width="4" stroke-linecap="round"/>
  <path id="right_eyebrow" d="M220 155 Q240 130 280 150" fill="none" stroke="#333" stroke-width="4" stroke-linecap="round"/>
</svg>',
    '[{"id":"forehead","name":"额头","x":140,"y":80,"width":120,"height":100,"defaultColor":"#DC143C"},{"id":"left_eye_socket","name":"左眼框","x":110,"y":185,"width":80,"height":45,"defaultColor":"#000000"},{"id":"right_eye_socket","name":"右眼框","x":210,"y":185,"width":80,"height":45,"defaultColor":"#000000"},{"id":"left_cheek","name":"左脸颊","x":75,"y":225,"width":90,"height":110,"defaultColor":"#DC143C"},{"id":"right_cheek","name":"右脸颊","x":235,"y":225,"width":90,"height":110,"defaultColor":"#DC143C"},{"id":"mouth","name":"嘴部","x":160,"y":335,"width":80,"height":35,"defaultColor":"#8B0000"},{"id":"face","name":"面部底色","x":60,"y":70,"width":280,"height":360,"defaultColor":"#DC143C"}]',
    1
),
(
    '包公脸谱',
    '黑脸包公脸谱模板，以黑色为主色调，象征公正',
    'default',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <ellipse id="face" cx="200" cy="250" rx="140" ry="180" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
  <path id="forehead" d="M200 70 Q280 80 300 120 Q280 160 200 180 Q120 160 100 120 Q120 80 200 70" fill="#1a1a1a" stroke="#fff" stroke-width="1.5"/>
  <path id="forehead_crescent" d="M180 110 Q200 90 220 110 Q200 120 180 110" fill="#FFD700" stroke="#FFD700" stroke-width="1"/>
  <ellipse id="left_eye_socket" cx="150" cy="200" rx="38" ry="22" fill="white" stroke="#fff" stroke-width="2"/>
  <ellipse id="right_eye_socket" cx="250" cy="200" rx="38" ry="22" fill="white" stroke="#fff" stroke-width="2"/>
  <ellipse id="left_cheek" cx="120" cy="280" rx="45" ry="55" fill="#1a1a1a" stroke="#fff" stroke-width="1.5"/>
  <ellipse id="right_cheek" cx="280" cy="280" rx="45" ry="55" fill="#1a1a1a" stroke="#fff" stroke-width="1.5"/>
  <path id="nose" d="M190 220 L210 220 L215 280 Q200 300 185 280 L190 220" fill="#333" stroke="#fff" stroke-width="1.5"/>
  <path id="mouth" d="M170 340 Q200 360 230 340 Q220 350 200 350 Q180 350 170 340" fill="#8B0000" stroke="#fff" stroke-width="1.5"/>
  <path id="left_eyebrow" d="M125 155 Q150 140 175 155" fill="none" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
  <path id="right_eyebrow" d="M225 155 Q250 140 275 155" fill="none" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
</svg>',
    '[{"id":"forehead","name":"额头","x":140,"y":80,"width":120,"height":100,"defaultColor":"#1a1a1a"},{"id":"left_eye_socket","name":"左眼框","x":112,"y":178,"width":76,"height":44,"defaultColor":"#FFFFFF"},{"id":"right_eye_socket","name":"右眼框","x":212,"y":178,"width":76,"height":44,"defaultColor":"#FFFFFF"},{"id":"left_cheek","name":"左脸颊","x":75,"y":225,"width":90,"height":110,"defaultColor":"#1a1a1a"},{"id":"right_cheek","name":"右脸颊","x":235,"y":225,"width":90,"height":110,"defaultColor":"#1a1a1a"},{"id":"mouth","name":"嘴部","x":165,"y":335,"width":70,"height":30,"defaultColor":"#8B0000"},{"id":"face","name":"面部底色","x":60,"y":70,"width":280,"height":360,"defaultColor":"#1a1a1a"}]',
    1
);
