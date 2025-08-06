// 게임 요소 선택
const player = document.getElementById('player');
const gameArea = document.querySelector('.game-area');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const levelElement = document.getElementById('level');
const moneyElement = document.getElementById('money');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');
const finalLevelElement = document.getElementById('finalLevel');
const finalMoneyElement = document.getElementById('finalMoney');
const playAgainBtn = document.getElementById('playAgainBtn');

// 게임 상태 변수
let gameActive = false;
let score = 0;
let money = 0; // 훔친 금액
let timeLeft = 60;
let level = 1;
let playerSpeed = 5;
let itemGenerationRate = 2000; // 아이템 생성 간격 (밀리초)
let guardGenerationRate = 5000; // 경비원 생성 간격 (밀리초)
let itemCount = 0;
let guardCount = 0;
let boxCount = 0;
let gameTimer;
let itemTimer;
let guardTimer;
let boxTimer;
let stairsTimer;
let playerX = 0;
let playerY = 0;
let playerWidth = 40;
let playerHeight = 40;
let keysPressed = {};
let guards = [];
let items = [];
let boxes = [];
let stairs = []; // 계단 배열
let isPlayerHidden = false; // 플레이어 숨김 상태
let isPlayerJumping = false; // 플레이어 점프 상태
let playerJumpHeight = 0; // 점프 높이
let playerJumpSpeed = 15; // 점프 속도
let playerGravity = 1; // 중력
let playerVelocityY = 0; // Y축 속도
let currentFloor = 1; // 현재 층 (1~5, 5는 옥상)
let totalItems = 8; // 총 아이템 수 (고정)
let collectedItems = 0; // 수집한 아이템 수
let isPlayerStunned = false; // 플레이어 기절 상태
let stunnedTimer = null; // 기절 타이머
let isEscaping = false; // 탈출 중 상태
let helicopter = null; // 헬리콥터 객체

// 각 층별 아이템 위치 (고정)
const itemPositions = [
    // 1층 아이템 (2개)
    {floor: 1, x: 100, type: 'pottery'},
    {floor: 1, x: 700, type: 'gold'},
    // 2층 아이템 (2개)
    {floor: 2, x: 200, type: 'pottery'},
    {floor: 2, x: 600, type: 'gold'},
    // 3층 아이템 (2개)
    {floor: 3, x: 300, type: 'gold'},
    {floor: 3, x: 500, type: 'diamond'},
    // 4층 아이템 (1개)
    {floor: 4, x: 400, type: 'diamond'},
    // 5층 아이템 (1개)
    {floor: 5, x: 350, type: 'diamond'}
];

// 각 층별 경비원 위치 (고정)
const guardPositions = [
    {floor: 1, x: 400},
    {floor: 2, x: 300},
    {floor: 3, x: 500},
    {floor: 4, x: 200},
    {floor: 5, x: 600}
];

// 각 층별 경비원 홈 위치 (돌아갈 위치)
const guardHomePositions = [
    {floor: 1, x: 400},
    {floor: 2, x: 300},
    {floor: 3, x: 500},
    {floor: 4, x: 200},
    {floor: 5, x: 600}
];

// 가격 문자열에서 숫자만 추출하는 함수
function extractNumber(priceString) {
    return parseInt(priceString.replace(/[^0-9]/g, ''));
}

// 나무상자 생성 함수
function createWoodenBox() {
    if (!gameActive) return;
    
    const gameAreaRect = gameArea.getBoundingClientRect();
    const boxWidth = 50;
    const boxHeight = 50;
    
    // 상자 위치 랜덤 생성 (화면 내부)
    const boxX = Math.random() * (gameAreaRect.width - boxWidth);
    const boxY = Math.random() * (gameAreaRect.height - boxHeight);
    
    // 상자 요소 생성
    const box = document.createElement('div');
    box.classList.add('wooden-box');
    box.style.left = `${boxX}px`;
    box.style.top = `${boxY}px`;
    box.dataset.id = `box-${boxCount++}`;
    gameArea.appendChild(box);
    
    // 상자 정보 저장
    boxes.push({
        id: box.dataset.id,
        element: box,
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight
    });
    
    // 20초 후 상자 자동 제거
    setTimeout(() => {
        if (box.parentNode) {
            box.remove();
            boxes = boxes.filter(b => b.id !== box.dataset.id);
        }
    }, 20000);
}

// 게임 초기화 함수
function initGame() {
    // 게임 상태 초기화
    gameActive = true;
    score = 0;
    money = 0;
    timeLeft = 60;
    level = 1;
    playerSpeed = 5;
    itemGenerationRate = 2000;
    guardGenerationRate = 5000;
    itemCount = 0;
    guardCount = 0;
    boxCount = 0;
    guards = [];
    items = [];
    boxes = [];
    stairs = []; // 계단 배열 초기화
    isPlayerHidden = false;
    isPlayerJumping = false; // 점프 상태 초기화
    playerJumpHeight = 0; // 점프 높이 초기화
    playerVelocityY = 0; // Y축 속도 초기화
    currentFloor = 1; // 현재 층 초기화
    totalItems = 0; // 총 아이템 수 초기화
    collectedItems = 0; // 수집한 아이템 수 초기화
    isPlayerStunned = false; // 기절 상태 초기화
    isEscaping = false; // 탈출 상태 초기화
    helicopter = null; // 헬리콥터 초기화
    
    if (stunnedTimer) {
        clearTimeout(stunnedTimer);
        stunnedTimer = null;
    }
    
    player.classList.remove('hidden');
    player.classList.remove('stunned'); // 기절 상태 클래스 제거
    
    // 백화점 안내 메시지 표시
    const welcomeMsg = document.createElement('div');
    welcomeMsg.textContent = '백화점에 오신 것을 환영합니다!';
    welcomeMsg.classList.add('item-collected');
    welcomeMsg.style.left = '50%';
    welcomeMsg.style.top = '30%';
    welcomeMsg.style.transform = 'translate(-50%, -50%)';
    welcomeMsg.style.fontSize = '24px';
    welcomeMsg.style.color = '#fff';
    gameArea.appendChild(welcomeMsg);
    
    // 2초 후 메시지 제거
    setTimeout(() => {
        welcomeMsg.remove();
    }, 2000);
    
    // UI 업데이트
    scoreElement.textContent = score;
    moneyElement.textContent = money.toLocaleString();
    timeElement.textContent = timeLeft;
    levelElement.textContent = level;
    
    // 플레이어 위치 초기화
    const gameAreaRect = gameArea.getBoundingClientRect();
    playerX = gameAreaRect.width / 2 - playerWidth / 2;
    playerY = gameAreaRect.height - playerHeight - 50; // 1층 바닥에 위치
    updatePlayerPosition();
    updateMinimapPlayerPosition(); // 미니맵 위치 업데이트
    
    // 기존 아이템 및 경비원 제거
    clearGameArea();
    
    // 초기 나무상자 생성 (3개)
    for (let i = 0; i < 3; i++) {
        createWoodenBox();
    }
    
    // 계단 생성
    createStairs();
    
    // 타이머 시작
    startTimers();
    
    // 버튼 상태 변경
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
}

// 게임 영역 초기화
function clearGameArea() {
    // 모든 아이템 제거
    document.querySelectorAll('.item').forEach(item => item.remove());
    items = [];
    
    // 모든 경비원 제거
    document.querySelectorAll('.guard').forEach(guard => guard.remove());
    guards = [];
    
    // 모든 나무상자 제거
    document.querySelectorAll('.wooden-box').forEach(box => box.remove());
    boxes = [];
    
    // 모든 계단 제거
    document.querySelectorAll('.stairs').forEach(stair => stair.remove());
    stairs = [];
    
    // 모든 느낌표 제거
    document.querySelectorAll('.guard-alert').forEach(alert => alert.remove());
    
    // 경고 효과 제거
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    // 모든 총알 제거
    document.querySelectorAll('.bullet').forEach(bullet => bullet.remove());
    
    // 헬리콥터 제거
    document.querySelectorAll('.helicopter').forEach(heli => heli.remove());
    helicopter = null;
}

// 타이머 시작 함수
function startTimers() {
    // 게임 타이머 (1초마다 시간 감소)
    gameTimer = setInterval(() => {
        timeLeft--;
        timeElement.textContent = timeLeft;
        
        // 시간이 다 되면 게임 종료
        if (timeLeft <= 0) {
            endGame();
        }
        
        // 레벨 업 조건 (10점마다)
        if (score > 0 && score % 10 === 0 && level < Math.floor(score / 10) + 1) {
            levelUp();
        }
        
        // 모든 아이템을 수집했고 옥상에 있으면 탈출 시작
        if (collectedItems >= totalItems && collectedItems > 0 && currentFloor === 5 && !isEscaping) {
            startEscape();
        }
    }, 1000);
    
    // 아이템 생성 타이머 - 고정된 위치에 아이템 생성
    // 모든 아이템을 한 번에 생성
    for (const position of itemPositions) {
        createItem(position);
    }
    
    // 총 아이템 수 설정
    totalItems = itemPositions.length;
    
    // 경비원 생성 타이머 (레벨 1부터 출현하도록 수정)
    // 게임 시작 시 경비원 한 명만 생성
    if (guardPositions.length > 0) {
        createGuard(guardPositions[0]); // 첫 번째 위치에만 경비원 생성
    }
    
    // 경비원이 제거되면 다시 생성하는 타이머
    guardTimer = setInterval(() => {
        // 경비원이 하나도 없을 때만 다시 생성
        if (guards.length === 0 && guardPositions.length > 0) {
            createGuard(guardPositions[0]); // 첫 번째 위치에만 경비원 생성
        }
    }, guardGenerationRate);
    
    // 나무상자 생성 타이머 (10초마다 새로운 상자 생성)
    boxTimer = setInterval(() => {
        // 최대 5개까지만 생성
        if (boxes.length < 5) {
            createWoodenBox();
        }
    }, 10000);
}

// 타이머 정지 함수
function stopTimers() {
    clearInterval(gameTimer);
    clearInterval(itemTimer);
    clearInterval(guardTimer);
    clearInterval(boxTimer);
    
    if (stunnedTimer) {
        clearTimeout(stunnedTimer);
        stunnedTimer = null;
    }
}

// 레벨 업 함수
function levelUp() {
    level++;
    levelElement.textContent = level;
    
    // 레벨에 따른 난이도 조정
    playerSpeed = 5 + level * 0.5; // 플레이어 속도 증가
    itemGenerationRate = Math.max(500, 2000 - level * 200); // 아이템 생성 속도 증가 (최소 500ms)
    guardGenerationRate = Math.max(2000, 5000 - level * 300); // 경비원 생성 속도 증가 (최소 2000ms)
    
    // 아이템 생성 타이머 재설정
    clearInterval(itemTimer);
    itemTimer = setInterval(createItem, itemGenerationRate);
    
    // 경비원 생성 타이머 재설정 (레벨 2부터)
    if (level >= 2) {
        clearInterval(guardTimer);
        guardTimer = setInterval(createGuard, guardGenerationRate);
    }
    
    // 레벨 업 효과 표시
    const levelUpEffect = document.createElement('div');
    levelUpEffect.textContent = `레벨 ${level}!`;
    levelUpEffect.classList.add('item-collected');
    levelUpEffect.style.left = '50%';
    levelUpEffect.style.top = '50%';
    levelUpEffect.style.transform = 'translate(-50%, -50%)';
    levelUpEffect.style.fontSize = '36px';
    gameArea.appendChild(levelUpEffect);
    
    // 1초 후 효과 제거
    setTimeout(() => {
        levelUpEffect.remove();
    }, 1000);
}

// 게임 종료 함수
function endGame() {
    gameActive = false;
    stopTimers();
    
    // 게임 오버 모달 표시
    finalScoreElement.textContent = score;
    finalLevelElement.textContent = level;
    finalMoneyElement.textContent = money.toLocaleString();
    gameOverModal.style.display = 'flex';
    
    // 버튼 상태 변경
    startBtn.style.display = 'inline-block';
    restartBtn.style.display = 'none';
}

// 아이템 생성 함수
function createItem(position) {
    if (!gameActive) return;
    
    const gameAreaRect = gameArea.getBoundingClientRect();
    const itemWidth = 30;
    const itemHeight = 30;
    
    // 위치가 지정되지 않은 경우 랜덤 위치 사용
    if (!position) {
        // 아직 생성되지 않은 아이템 위치 찾기
        for (const pos of itemPositions) {
            // 이미 해당 위치에 아이템이 있는지 확인
            const itemExists = items.some(item => 
                item.type === pos.type && 
                Math.abs(item.x - pos.x) < 10
            );
            
            if (!itemExists) {
                position = pos;
                break;
            }
        }
        
        // 모든 위치에 아이템이 있으면 생성하지 않음
        if (!position) return;
    }
    
    // 아이템 점수 및 가격 설정
    let itemScore = 1;
    let itemPrice = '5,000원';
    
    if (position.type === 'pottery') {
        itemScore = 1;
        itemPrice = '5,000원';
    } else if (position.type === 'gold') {
        itemScore = 3;
        itemPrice = '15,000원';
    } else if (position.type === 'diamond') {
        itemScore = 7;
        itemPrice = '50,000원';
    }
    
    // 층에 따른 Y 위치 계산
    const floorHeight = gameAreaRect.height / 5;
    const itemY = gameAreaRect.height - (position.floor * floorHeight) + 50;
    const itemX = position.x;
    
    // 아이템 요소 생성
    const item = document.createElement('div');
    item.classList.add('item');
    item.classList.add(position.type); // 도자기, 금괴, 다이아몬드 클래스 추가
    item.style.left = `${itemX}px`;
    item.style.top = `${itemY}px`;
    item.dataset.score = itemScore;
    item.dataset.price = itemPrice; // 가격 정보 추가
    item.dataset.id = `item-${itemCount++}`;
    item.dataset.floor = position.floor; // 층 정보 추가
    gameArea.appendChild(item);
    
    // 아이템 정보 저장
    items.push({
        id: item.dataset.id,
        element: item,
        x: itemX,
        y: itemY,
        width: itemWidth,
        height: itemHeight,
        score: itemScore,
        price: itemPrice,
        type: position.type,
        floor: position.floor
    });
    
    // 10초 후 아이템 자동 제거
    setTimeout(() => {
        if (item.parentNode) {
            item.remove();
            items = items.filter(i => i.id !== item.dataset.id);
        }
    }, 10000);
}

// 경비원 생성 함수
function createGuard(position) {
    if (!gameActive) return; // 레벨 1부터 경비원 출현하도록 수정
    
    // position이 제공되지 않은 경우 랜덤으로 선택
    if (!position) {
        // 각 층별로 경비원이 이미 있는지 확인
        for (const pos of guardPositions) {
            // 해당 층에 경비원이 이미 있는지 확인
            const guardExists = guards.some(guard => guard.floor === pos.floor);
            
            if (!guardExists) {
                position = pos;
                break;
            }
        }
        
        // 모든 층에 경비원이 있으면 생성하지 않음
        if (!position) return;
    }
    
    // 해당 층에 경비원이 이미 있는지 확인
    const guardExists = guards.some(guard => guard.floor === position.floor);
    if (guardExists) return;
    
    const gameAreaRect = gameArea.getBoundingClientRect();
    const guardWidth = 20;
    const guardHeight = 20;
    
    // 층에 따른 Y 위치 계산
    const floorHeight = gameAreaRect.height / 5;
    //const guardY = gameAreaRect.height - (position.floor * floorHeight) + 50;
    const guardY = floorHeight;
    const guardX = position.x;
    
    // 경비원 요소 생성
    const guard = document.createElement('div');
    guard.classList.add('guard');
    guard.style.left = `${guardX}px`;
    guard.style.top = `${guardY}px`;
    // 고유 ID 추가 (타임스탬프 + 랜덤값 조합)
    const guardId = `guard-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    guard.dataset.id = guardId;
    guard.dataset.floor = position.floor;
    gameArea.appendChild(guard);
    
    // 경비원 정보 저장
    const guardSpeed = 1 + level * 0.1; // 레벨에 따라 속도 증가
    const guardObj = {
        id: guard.dataset.id,
        element: guard,
        x: guardX,
        y: guardY,
        width: guardWidth,
        height: guardHeight,
        speed: guardSpeed,
        randomTarget: null, // 랜덤 이동 목표점 추가
        stunned: false, // 기절 상태
        lookingAtPlayer: false, // 플레이어를 보고 있는지 여부
        floor: position.floor, // 층 정보 추가
        homeX: guardHomePositions[position.floor - 1].x // 경비원이 돌아갈 위치
    };
    guards.push(guardObj);
    
    // 미니맵에 경비원 추가
    addGuardToMinimap(guardObj);
    
    // 경비원 움직임 시작
    moveGuard(guardObj);
    
    // 30초 후 경비원 자동 제거
    setTimeout(() => {
        if (guard.parentNode) {
            guard.remove();
            guards = guards.filter(g => g.id !== guard.dataset.id);
            // 미니맵에서도 제거
            removeGuardFromMinimap(guardObj.id);
        }
    }, 30000);
}


// 경비원 움직임 함수
function moveGuard(guard) {
    if (!gameActive) return;
    
    // 경비원이 기절 상태면 움직이지 않음
    if (guard.stunned) {
        // 다음 프레임에서 계속 확인
        requestAnimationFrame(() => moveGuard(guard));
        return;
    }
    
    // 플레이어가 숨어있으면 랜덤하게 움직임
    let targetX, targetY;
    
    if (isPlayerHidden) {
        // 플레이어가 숨어있으면 랜덤 방향으로 이동
        if (!guard.randomTarget) {
            const gameAreaRect = gameArea.getBoundingClientRect();
            guard.randomTarget = {
                x: Math.random() * gameAreaRect.width,
                y: Math.random() * gameAreaRect.height
            };
        }
        
        targetX = guard.randomTarget.x - guard.x;
        targetY = guard.randomTarget.y - guard.y;
        
        // 목표에 도달하면 새로운 랜덤 목표 설정
        const distToTarget = Math.sqrt(targetX * targetX + targetY * targetY);
        if (distToTarget < 20) {
            guard.randomTarget = null;
        }
        
        // 느낌표 숨기기
        hideGuardAlert(guard);
        
        // 플레이어를 보고 있지 않음 (총에 맞을 수 있음)
        guard.lookingAtPlayer = false;
    } else {
        // 플레이어가 숨어있지 않으면 플레이어 방향으로 이동
        targetX = playerX - guard.x;
        targetY = playerY - guard.y;
        
        // 플레이어와의 거리 계산
        const distToPlayer = Math.sqrt(targetX * targetX + targetY * targetY);
        
        // 플레이어가 5단위 이상 떨어져 있으면 원래 위치로 돌아감
        if (distToPlayer > 500) {
            // 원래 위치(homeX)로 돌아가기
            targetX = guard.homeX - guard.x;
            targetY = 0; // Y축으로는 이동하지 않음 (같은 층에서만 이동)
            
            // 느낌표 숨기기
            hideGuardAlert(guard);
            // 플레이어를 보고 있지 않음
            guard.lookingAtPlayer = false;
        } else if (distToPlayer < 150) {
            // 플레이어가 시야 내에 있으면 느낌표 표시 (150px 이내)
            showGuardAlert(guard);
            // 플레이어를 보고 있음 (총에 맞지 않음)
            guard.lookingAtPlayer = true;
        } else {
            hideGuardAlert(guard);
            // 플레이어를 보고 있지 않음 (총에 맞을 수 있음)
            guard.lookingAtPlayer = false;
        }
    }
    
    const distance = Math.sqrt(targetX * targetX + targetY * targetY);
    
    // 정규화된 방향 벡터
    const vx = distance > 0 ? targetX / distance : 0;
    const vy = distance > 0 ? targetY / distance : 0;
    
    // 경비원 위치 업데이트
    guard.x += vx * guard.speed;
    guard.y += vy * guard.speed;
    
    // 화면에 반영
    guard.element.style.left = `${guard.x}px`;
    guard.element.style.top = `${guard.y}px`;
    
    // 미니맵에 경비원 위치 업데이트
    updateMinimapGuardPosition(guard);
    
    // 플레이어와 충돌 확인 (플레이어가 숨어있지 않을 때만)
    if (!isPlayerHidden && !isPlayerStunned && !isEscaping && checkCollision({
        x: playerX,
        y: playerY,
        width: playerWidth,
        height: playerHeight
    }, guard)) {
        // 경비원에게 잡힘 (게임 오버)
        showAlert();
        setTimeout(() => {
            endGame();
        }, 500);
        return;
    }
    
    // 다음 프레임에서 계속 이동
    requestAnimationFrame(() => moveGuard(guard));
}

// 경비원 느낌표 표시 함수
function showGuardAlert(guard) {
    // 이미 느낌표가 있으면 리턴
    if (guard.element.querySelector('.guard-alert')) return;
    
    // 느낌표 생성
    const alert = document.createElement('div');
    alert.classList.add('guard-alert');
    guard.element.appendChild(alert);
    
    // 느낌표 표시
    alert.style.display = 'block';
    
    // 1.7초 후 느낌표 제거
    setTimeout(() => {
        hideGuardAlert(guard);
    }, 1700);
}

// 경비원 느낌표 숨기기 함수
function hideGuardAlert(guard) {
    const alert = guard.element.querySelector('.guard-alert');
    if (alert) {
        alert.remove();
    }
}

// 경고 효과 표시 함수
function showAlert() {
    const alert = document.createElement('div');
    alert.classList.add('alert');
    gameArea.appendChild(alert);
}

// 충돌 감지 함수
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// 플레이어 위치 업데이트 함수
function updatePlayerPosition() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
}

// 미니맵 플레이어 위치 업데이트 함수
function updateMinimapPlayerPosition() {
    const minimapPlayer = document.getElementById('minimap-player');
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    // 게임 영역 내 플레이어의 상대적 위치 계산 (0~1 사이 값)
    const relativeX = playerX / gameAreaRect.width;
    
    // 플레이어의 Y 위치에 따라 층 결정
    // 게임 영역을 5개 층으로 나누어 계산 (1~4층 + 옥상)
    const floorHeight = gameAreaRect.height / 5;
    let floor = Math.floor(playerY / floorHeight);
    // 층 번호 반전 (위에서부터 5층(옥상), 4층, 3층, 2층, 1층)
    floor = 4 - floor;
    
    // 층 내에서의 상대적 위치 (0~1 사이 값)
    const relativeYInFloor = (playerY % floorHeight) / floorHeight;
    
    // 미니맵 내 위치 계산
    const minimapWidth = 150; // .minimap의 width
    const minimapFloorHeight = 24; // .minimap-floor의 height (20%의 120px)
    
    const minimapX = relativeX * minimapWidth;
    const minimapY = (floor * minimapFloorHeight) + (relativeYInFloor * minimapFloorHeight);
    
    // 미니맵 플레이어 위치 업데이트
    minimapPlayer.style.left = `${minimapX}px`;
    minimapPlayer.style.top = `${minimapY}px`;
}

// 플레이어 이동 함수
function movePlayer() {
    if (!gameActive) return;
    
    // 플레이어가 숨어있거나 기절 상태면 이동 불가
    if (!isPlayerHidden && !isPlayerStunned && !isEscaping) {
        const gameAreaRect = gameArea.getBoundingClientRect();
        
        // 점프 처리
        if (isPlayerJumping) {
            // 중력 적용
            playerVelocityY += playerGravity;
            playerY += playerVelocityY;
            
            // 바닥에 닿으면 점프 종료
            if (playerY >= gameAreaRect.height - playerHeight) {
                playerY = gameAreaRect.height - playerHeight;
                isPlayerJumping = false;
                playerVelocityY = 0;
            }
        }
        
        // W키는 점프
        if ((keysPressed['ArrowUp'] || keysPressed['w'] || keysPressed['W']) && !isPlayerJumping) {
            isPlayerJumping = true;
            playerVelocityY = -playerJumpSpeed;
            
            // 점프 메시지 표시
            const jumpMsg = document.createElement('div');
            jumpMsg.textContent = '점프!';
            jumpMsg.classList.add('item-collected');
            jumpMsg.style.left = `${playerX}px`;
            jumpMsg.style.top = `${playerY - 30}px`;
            jumpMsg.style.color = '#fff';
            gameArea.appendChild(jumpMsg);
            
            // 1초 후 메시지 제거
            setTimeout(() => {
                if (jumpMsg.parentNode) {
                    jumpMsg.remove();
                }
            }, 1000);
        }
        
        if (keysPressed['ArrowDown'] || keysPressed['s'] || keysPressed['S']) {
            playerY = Math.min(gameAreaRect.height - playerHeight, playerY + playerSpeed);
        }
        // A키는 뒤로 이동
        if (keysPressed['ArrowLeft'] || keysPressed['a'] || keysPressed['A']) {
            playerX = Math.max(0, playerX - playerSpeed);
        }
        // D키는 앞으로 이동
        if (keysPressed['ArrowRight'] || keysPressed['d'] || keysPressed['D']) {
            playerX = Math.min(gameAreaRect.width - playerWidth, playerX + playerSpeed);
        }
        
        // 계단과의 충돌 확인
        checkStairsCollisions();
        
        // 플레이어 위치 업데이트
        updatePlayerPosition();
        
        // 미니맵에 플레이어 위치 업데이트
        updateMinimapPlayerPosition();
        
        // 아이템 충돌 확인
        checkItemCollisions();
    } else if (isEscaping) {
        // 탈출 중인 경우 헬리콥터와 함께 이동
        updateEscapeAnimation();
    }
    
    // 다음 프레임에서 계속 이동
    requestAnimationFrame(movePlayer);
}

// 아이템 충돌 확인 함수
function checkItemCollisions() {
    const playerObj = {
        x: playerX,
        y: playerY,
        width: playerWidth,
        height: playerHeight
    };
    
    // 모든 아이템에 대해 충돌 확인
    items.forEach(item => {
        if (checkCollision(playerObj, item)) {
            // 아이템 획득
            collectItem(item);
        }
    });
}

// 아이템 획득 함수
function collectItem(item) {
    // 점수 추가
    score += parseInt(item.score);
    scoreElement.textContent = score;
    
    // 금액 추가
    const itemMoneyValue = extractNumber(item.price);
    money += itemMoneyValue;
    moneyElement.textContent = money.toLocaleString();
    
    // 수집한 아이템 수 증가
    collectedItems++;
    
    // 아이템 획득 효과 표시
    const scoreEffect = document.createElement('div');
    scoreEffect.textContent = `+${item.score} (${item.price})`;
    scoreEffect.classList.add('item-collected');
    scoreEffect.style.left = `${item.x + 15}px`;
    scoreEffect.style.top = `${item.y}px`;
    gameArea.appendChild(scoreEffect);
    
    // 아이템 사라짐 효과
    item.element.classList.add('stolen');
    
    // 아이템 제거
    setTimeout(() => {
        if (item.element.parentNode) {
            item.element.remove();
            scoreEffect.remove();
        }
    }, 1000);
    
    // 아이템 목록에서 제거
    items = items.filter(i => i.id !== item.id);
    
    // 모든 아이템을 수집했고 옥상에 있으면 탈출 시작
    if (collectedItems >= totalItems && collectedItems > 0 && currentFloor === 5 && !isEscaping) {
        startEscape();
    }
}

// 플레이어 숨기 함수
function hidePlayer() {
    // 플레이어 주변에 나무상자가 있는지 확인
    const playerObj = {
        x: playerX,
        y: playerY,
        width: playerWidth,
        height: playerHeight
    };
    
    // 가장 가까운 상자 찾기
    let nearestBox = null;
    let minDistance = 100; // 최대 100px 거리까지만 인식
    
    boxes.forEach(box => {
        const dx = (box.x + box.width/2) - (playerX + playerWidth/2);
        const dy = (box.y + box.height/2) - (playerY + playerHeight/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestBox = box;
        }
    });
    
    // 가까운 상자가 있으면 숨기
    if (nearestBox) {
        isPlayerHidden = !isPlayerHidden;
        
        if (isPlayerHidden) {
            // 플레이어 숨기기
            player.classList.add('hidden');
            
            // 상자 활성화 효과
            nearestBox.element.classList.add('active');
            
            // 숨기 메시지 표시
            const hideMsg = document.createElement('div');
            hideMsg.textContent = '나무 상자에 숨었습니다!';
            hideMsg.classList.add('item-collected');
            hideMsg.style.left = `${playerX}px`;
            hideMsg.style.top = `${playerY - 20}px`;
            hideMsg.style.color = '#fff';
            gameArea.appendChild(hideMsg);
            
            // 2초 후 메시지 제거
            setTimeout(() => {
                if (hideMsg.parentNode) {
                    hideMsg.remove();
                }
            }, 1000);
            
            // 플레이어 위치를 상자 위치로 이동
            playerX = nearestBox.x;
            playerY = nearestBox.y;
            updatePlayerPosition();
        } else {
            // 플레이어 보이기
            player.classList.remove('hidden');
            
            // 상자 비활성화
            document.querySelectorAll('.wooden-box.active').forEach(box => {
                box.classList.remove('active');
            });
            
            // 보이기 메시지 표시
            const showMsg = document.createElement('div');
            showMsg.textContent = '나무 상자에서 나왔습니다!';
            showMsg.classList.add('item-collected');
            showMsg.style.left = `${playerX}px`;
            showMsg.style.top = `${playerY - 20}px`;
            showMsg.style.color = '#fff';
            gameArea.appendChild(showMsg);
            
            // 2초 후 메시지 제거
            setTimeout(() => {
                if (showMsg.parentNode) {
                    showMsg.remove();
                }
            }, 1000);
        }
    } else {
        // 가까운 상자가 없으면 메시지 표시
        const noBoxMsg = document.createElement('div');
        noBoxMsg.textContent = '숨을 나무 상자가 근처에 없습니다!';
        noBoxMsg.classList.add('item-collected');
        noBoxMsg.style.left = `${playerX}px`;
        noBoxMsg.style.top = `${playerY - 20}px`;
        noBoxMsg.style.color = '#ff0000';
        gameArea.appendChild(noBoxMsg);
        
        // 2초 후 메시지 제거
        setTimeout(() => {
            if (noBoxMsg.parentNode) {
                noBoxMsg.remove();
            }
        }, 1000);
    }
}

// 키보드 이벤트 리스너
document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
    
    // E키를 누르면 숨기/보이기 토글
    if (e.key === 'e' || e.key === 'E') {
        if (gameActive && !isPlayerStunned && !isEscaping) {
            hidePlayer();
        }
    }
    
    // 스페이스바를 누르면 총 발사
    if (e.key === ' ' && gameActive && !isPlayerHidden && !isPlayerStunned && !isEscaping) {
        shootGun();
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

// 게임 시작 버튼 이벤트 리스너
startBtn.addEventListener('click', () => {
    initGame();
    movePlayer();
});

// 다시 시작 버튼 이벤트 리스너
restartBtn.addEventListener('click', () => {
    stopTimers();
    initGame();
});

// 게임 오버 모달의 다시 하기 버튼 이벤트 리스너
playAgainBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
    initGame();
    movePlayer();
});

// 창 크기 변경 시 플레이어 위치 조정
window.addEventListener('resize', () => {
    if (gameActive) {
        const gameAreaRect = gameArea.getBoundingClientRect();
        playerX = Math.min(playerX, gameAreaRect.width - playerWidth);
        playerY = Math.min(playerY, gameAreaRect.height - playerHeight);
        updatePlayerPosition();
    }
});

// 초기 플레이어 위치 설정
window.addEventListener('load', () => {
    const gameAreaRect = gameArea.getBoundingClientRect();
    playerX = gameAreaRect.width / 2 - playerWidth / 2;
    playerY = gameAreaRect.height / 2 - playerHeight / 2;
    updatePlayerPosition();
    updateMinimapPlayerPosition();
});

// 미니맵에 경비원 추가 함수
function addGuardToMinimap(guard) {
    const minimapContent = document.querySelector('.minimap-content');
    const minimapGuard = document.createElement('div');
    minimapGuard.classList.add('minimap-guard');
    minimapGuard.dataset.guardId = guard.id;
    minimapContent.appendChild(minimapGuard);
    
    // 초기 위치 설정
    updateMinimapGuardPosition(guard);
}

// 계단 생성 함수
function createStairs() {
    const gameAreaRect = gameArea.getBoundingClientRect();
    const stairWidth = 60;
    const stairHeight = 30;
    
    // 각 층에 계단 생성 (1층~4층, 5층은 옥상)
    for (let floor = 1; floor <= 4; floor++) {
        // 층별 Y 위치 계산 (아래에서부터 1, 2, 3, 4층)
        const floorHeight = gameAreaRect.height / 5;
        const stairY = gameAreaRect.height - (floor * floorHeight) + 10;
        
        // 계단 X 위치는 랜덤 (화면 내부)
        const stairX = Math.random() * (gameAreaRect.width - stairWidth - 100) + 50;
        
        // 계단 요소 생성
        const stair = document.createElement('div');
        stair.classList.add('stairs');
        stair.style.left = `${stairX}px`;
        stair.style.top = `${stairY}px`;
        stair.dataset.floor = floor;
        stair.dataset.id = `stairs-${floor}`;
        gameArea.appendChild(stair);
        
        // 계단 정보 저장
        stairs.push({
            id: stair.dataset.id,
            element: stair,
            x: stairX,
            y: stairY,
            width: stairWidth,
            height: stairHeight,
            floor: floor,
            targetFloor: floor + 1
        });
    }
}

// 계단 충돌 확인 함수
function checkStairsCollisions() {
    const playerObj = {
        x: playerX,
        y: playerY,
        width: playerWidth,
        height: playerHeight
    };
    
    // 모든 계단에 대해 충돌 확인
    for (const stair of stairs) {
        if (checkCollision(playerObj, stair)) {
            // 계단 이용 (다음 층으로 이동)
            useStairs(stair);
            break;
        }
    }
}

// 계단 이용 함수
function useStairs(stair) {
    // 이미 다른 층으로 이동 중이면 리턴
    if (isPlayerJumping) return;
    
    const gameAreaRect = gameArea.getBoundingClientRect();
    const floorHeight = gameAreaRect.height / 5;
    
    // 다음 층으로 이동 (Y 좌표 변경)
    const targetFloor = stair.targetFloor;
    const targetY = gameAreaRect.height - (targetFloor * floorHeight) + playerHeight;
    
    // 플레이어 위치 변경
    playerY = targetY;
    updatePlayerPosition();
    updateMinimapPlayerPosition();
    
    // 계단 이용 메시지 표시
    const stairMsg = document.createElement('div');
    stairMsg.textContent = `${targetFloor}${targetFloor === 5 ? '층(옥상)' : '층'}으로 이동!`;
    stairMsg.classList.add('item-collected');
    stairMsg.style.left = `${playerX}px`;
    stairMsg.style.top = `${playerY - 30}px`;
    stairMsg.style.color = '#fff';
    gameArea.appendChild(stairMsg);
    
    // 2초 후 메시지 제거
    setTimeout(() => {
        if (stairMsg.parentNode) {
            stairMsg.remove();
        }
    }, 1000);
}

// 총 발사 함수
function shootGun() {
    if (!gameActive || isPlayerHidden || isPlayerStunned || isEscaping) return;
    
    // 총알 생성
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = `${playerX + playerWidth / 2}px`;
    bullet.style.top = `${playerY + playerHeight / 2}px`;
    gameArea.appendChild(bullet);
    
    // 총 발사 방향 (플레이어가 바라보는 방향)
    // 기본적으로 오른쪽 방향으로 발사
    let bulletDirectionX = 1;
    let bulletDirectionY = 0;
    
    // 키 입력에 따라 방향 결정
    if (keysPressed['ArrowUp'] || keysPressed['w'] || keysPressed['W']) {
        bulletDirectionY = -1;
        bulletDirectionX = 0;
    } else if (keysPressed['ArrowDown'] || keysPressed['s'] || keysPressed['S']) {
        bulletDirectionY = 1;
        bulletDirectionX = 0;
    } else if (keysPressed['ArrowLeft'] || keysPressed['a'] || keysPressed['A']) {
        bulletDirectionX = -1;
        bulletDirectionY = 0;
    }
    
    // 총알 속도
    const bulletSpeed = 10;
    
    // 총알 이동 함수
    function moveBullet() {
        // 현재 위치 가져오기
        const bulletX = parseFloat(bullet.style.left);
        const bulletY = parseFloat(bullet.style.top);
        
        // 새 위치 계산
        const newBulletX = bulletX + bulletDirectionX * bulletSpeed;
        const newBulletY = bulletY + bulletDirectionY * bulletSpeed;
        
        // 화면 밖으로 나가면 제거
        const gameAreaRect = gameArea.getBoundingClientRect();
        if (newBulletX < 0 || newBulletX > gameAreaRect.width || 
            newBulletY < 0 || newBulletY > gameAreaRect.height) {
            bullet.remove();
            return;
        }
        
        // 위치 업데이트
        bullet.style.left = `${newBulletX}px`;
        bullet.style.top = `${newBulletY}px`;
        
        // 경비원과 충돌 확인
        const bulletObj = {
            x: newBulletX,
            y: newBulletY,
            width: 10,
            height: 10
        };
        
        for (const guard of guards) {
            // 이미 기절한 경비원은 무시
            if (guard.stunned) continue;
            
            // 경비원이 플레이어를 보고 있으면 총에 맞지 않음
            if (guard.lookingAtPlayer) continue;
            
            if (checkCollision(bulletObj, guard)) {
                // 경비원 기절
                stunGuard(guard);
                
                // 총알 제거
                bullet.remove();
                return;
            }
        }
        
        // 다음 프레임에서 계속 이동
        requestAnimationFrame(moveBullet);
    }
    
    // 총알 이동 시작
    moveBullet();
    
    // 총 발사 효과음 (나중에 추가)
}

// 경비원 기절 함수
function stunGuard(guard) {
    // 경비원 기절 상태로 변경
    guard.stunned = true;
    guard.element.classList.add('stunned');
    
    // 기절 메시지 표시
    const stunMsg = document.createElement('div');
    stunMsg.textContent = '기절!';
    stunMsg.classList.add('item-collected');
    stunMsg.style.left = `${guard.x}px`;
    stunMsg.style.top = `${guard.y - 20}px`;
    stunMsg.style.color = '#ff0000';
    gameArea.appendChild(stunMsg);
    
    // 2초 후 메시지 제거
    setTimeout(() => {
        if (stunMsg.parentNode) {
            stunMsg.remove();
        }
    }, 1000);
    
    // 5초 후 기절 해제
    setTimeout(() => {
        if (guard.element.parentNode) {
            guard.stunned = false;
            guard.element.classList.remove('stunned');
        }
    }, 5000);
}

// 헬리콥터 탈출 시작 함수
function startEscape() {
    if (isEscaping) return;
    
    isEscaping = true;
    
    // 헬리콥터 생성
    const gameAreaRect = gameArea.getBoundingClientRect();
    const heliWidth = 100;
    const heliHeight = 50;
    
    // 헬리콥터 요소 생성 (옥상 위에)
    const heli = document.createElement('div');
    heli.classList.add('helicopter');
    heli.style.left = `${gameAreaRect.width - heliWidth - 50}px`;
    heli.style.top = `${gameAreaRect.height / 5 - heliHeight - 20}px`; // 옥상 위치
    gameArea.appendChild(heli);
    
    // 헬리콥터 정보 저장
    helicopter = {
        element: heli,
        x: parseFloat(heli.style.left),
        y: parseFloat(heli.style.top),
        width: heliWidth,
        height: heliHeight
    };
    
    // 탈출 메시지 표시
    const escapeMsg = document.createElement('div');
    escapeMsg.textContent = '모든 물건을 훔쳤습니다! 헬리콥터로 탈출하세요!';
    escapeMsg.classList.add('item-collected');
    escapeMsg.style.left = '50%';
    escapeMsg.style.top = '30%';
    escapeMsg.style.transform = 'translate(-50%, -50%)';
    escapeMsg.style.fontSize = '24px';
    escapeMsg.style.color = '#fff';
    gameArea.appendChild(escapeMsg);
    
    // 3초 후 메시지 제거
    setTimeout(() => {
        if (escapeMsg.parentNode) {
            escapeMsg.remove();
        }
    }, 3000);
    
    // 플레이어가 헬리콥터에 도달하면 게임 클리어
    const escapeInterval = setInterval(() => {
        if (!gameActive || !isEscaping) {
            clearInterval(escapeInterval);
            return;
        }
        
        const playerObj = {
            x: playerX,
            y: playerY,
            width: playerWidth,
            height: playerHeight
        };
        
        if (checkCollision(playerObj, helicopter)) {
            // 헬리콥터 탑승 성공
            clearInterval(escapeInterval);
            completeEscape();
        }
    }, 100);
}

// 탈출 애니메이션 업데이트 함수
function updateEscapeAnimation() {
    if (!isEscaping || !helicopter || !gameActive) return;
    
    // 플레이어가 헬리콥터에 탑승했는지 확인
    const playerObj = {
        x: playerX,
        y: playerY,
        width: playerWidth,
        height: playerHeight
    };
    
    if (checkCollision(playerObj, helicopter)) {
        // 헬리콥터 탑승 성공
        completeEscape();
    }
}

// 탈출 완료 함수
function completeEscape() {
    // 플레이어를 헬리콥터 위치로 이동
    playerX = helicopter.x + helicopter.width / 2 - playerWidth / 2;
    playerY = helicopter.y + helicopter.height / 2 - playerHeight / 2;
    updatePlayerPosition();
    
    // 탈출 성공 메시지 표시
    const successMsg = document.createElement('div');
    successMsg.textContent = '탈출 성공! 게임 클리어!';
    successMsg.classList.add('item-collected');
    successMsg.style.left = '50%';
    successMsg.style.top = '50%';
    successMsg.style.transform = 'translate(-50%, -50%)';
    successMsg.style.fontSize = '36px';
    successMsg.style.color = '#ffff00';
    gameArea.appendChild(successMsg);
    
    // 헬리콥터와 함께 화면 밖으로 이동
    const flyAway = setInterval(() => {
        helicopter.x -= 2;
        helicopter.y -= 1;
        helicopter.element.style.left = `${helicopter.x}px`;
        helicopter.element.style.top = `${helicopter.y}px`;
        
        // 플레이어도 함께 이동
        playerX = helicopter.x + helicopter.width / 2 - playerWidth / 2;
        playerY = helicopter.y + helicopter.height / 2 - playerHeight / 2;
        updatePlayerPosition();
        
        // 화면 밖으로 나가면 게임 종료
        if (helicopter.x < -helicopter.width) {
            clearInterval(flyAway);
            
            // 3초 후 게임 종료
            setTimeout(() => {
                // 추가 점수 부여
                score += 100;
                money += 100000;
                
                // 게임 종료
                endGame();
            }, 3000);
        }
    }, 50);
}

// 미니맵에서 경비원 제거 함수
function removeGuardFromMinimap(guardId) {
    const minimapGuard = document.querySelector(`.minimap-guard[data-guard-id="${guardId}"]`);
    if (minimapGuard) {
        minimapGuard.remove();
    }
}

// 미니맵 경비원 위치 업데이트 함수
function updateMinimapGuardPosition(guard) {
    const minimapGuard = document.querySelector(`.minimap-guard[data-guard-id="${guard.id}"]`);
    if (!minimapGuard) return;
    
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    // 게임 영역 내 경비원의 상대적 위치 계산 (0~1 사이 값)
    const relativeX = guard.x / gameAreaRect.width;
    
    // 경비원의 Y 위치에 따라 층 결정
    const floorHeight = gameAreaRect.height / 5;
    let floor = Math.floor(guard.y / floorHeight);
    // 층 번호 반전 (위에서부터 5층(옥상), 4층, 3층, 2층, 1층)
    floor = 4 - floor;
    
    // 층 내에서의 상대적 위치 (0~1 사이 값)
    const relativeYInFloor = (guard.y % floorHeight) / floorHeight;
    
    // 미니맵 내 위치 계산
    const minimapWidth = 150; // .minimap의 width
    const minimapFloorHeight = 24; // .minimap-floor의 height (20%의 120px)
    
    const minimapX = relativeX * minimapWidth;
    const minimapY = (floor * minimapFloorHeight) + (relativeYInFloor * minimapFloorHeight);
    
    // 미니맵 경비원 위치 업데이트
    minimapGuard.style.left = `${minimapX}px`;
    minimapGuard.style.top = `${minimapY}px`;
}