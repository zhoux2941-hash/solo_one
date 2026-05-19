class Collab3DEditor {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.transformControls = null;
        this.objects = new Map();
        this.selectedObject = null;
        this.currentMode = 'translate';
        
        this.webTransport = null;
        this.dataChannel = null;
        this.connected = false;
        this.userId = null;
        this.userName = 'User';
        this.roomId = 'default-room';
        this.roomUsers = new Map();
        
        this.db = null;
        this.pendingOperations = [];
        this.latency = 0;
        this.lastPingTime = 0;
        this.objectLocks = new Map();
        this.isDragging = false;
        this.originalMaterials = new Map();
        
        this.groups = new Map();
        this.selectedObjects = new Set();
        this.selectedGroup = null;
        this.isMultiSelect = false;
        
        this.init();
    }
    
    async init() {
        await this.initIndexedDB();
        this.initThreeJS();
        this.initUI();
        this.animate();
        await this.loadSceneFromDB();
    }
    
    async initIndexedDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open('Collab3DEditor', 2);
            
            request.onerror = () => {
                console.error('IndexedDB error');
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('sceneObjects')) {
                    db.createObjectStore('sceneObjects', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('sceneGroups')) {
                    db.createObjectStore('sceneGroups', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('pendingOps')) {
                    db.createObjectStore('pendingOps', { keyPath: 'timestamp' });
                }
            };
            
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
        });
    }
    
    initThreeJS() {
        const viewport = document.getElementById('viewport');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x11111b);
        
        this.camera = new THREE.PerspectiveCamera(
            60,
            viewport.clientWidth / viewport.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(8, 8, 8);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        this.renderer.shadowMap.enabled = true;
        viewport.appendChild(this.renderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        const gridHelper = new THREE.GridHelper(20, 20, 0x45475a, 0x313244);
        this.scene.add(gridHelper);
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        
        this.transformControls = new THREE.TransformControls(
            this.camera,
            this.renderer.domElement
        );
        this.transformControls.setMode(this.currentMode);
        this.scene.add(this.transformControls);
        
        this.transformControls.addEventListener('dragging-changed', (e) => {
            this.controls.enabled = !e.value;
            this.isDragging = e.value;
            
            if (this.selectedObject) {
                if (e.value) {
                    this.sendLockObject(this.selectedObject.userData.id);
                } else {
                    this.sendUnlockObject(this.selectedObject.userData.id);
                    if (this.selectedObject.userData.type === 'group') {
                        this.saveGroupToDB(this.selectedObject.userData);
                    } else {
                        this.saveObjectToDB(this.selectedObject.userData);
                    }
                }
            }
        });
        
        this.transformControls.addEventListener('objectChange', () => {
            if (this.selectedObject && this.isDragging) {
                const objId = this.selectedObject.userData.id;
                const lockOwner = this.objectLocks.get(objId);
                if (!lockOwner || lockOwner === this.userId) {
                    if (this.selectedObject.userData.type === 'group') {
                        this.syncGroupUpdate(this.selectedObject);
                    } else {
                        this.syncObjectUpdate(this.selectedObject);
                    }
                }
            }
        });
        
        window.addEventListener('resize', () => this.onResize());
        
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('click', (e) => {
            if (this.transformControls.dragging) return;
            
            const rect = this.renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            const allObjects = Array.from(this.objects.values()).concat(Array.from(this.groups.values()));
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(allObjects);
            
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                if (e.ctrlKey || e.metaKey) {
                    this.toggleObjectSelection(clickedObject);
                } else {
                    this.selectObject(clickedObject);
                }
            } else {
                this.deselectAll();
            }
        });
    }
    
    initUI() {
        document.getElementById('joinBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('leaveBtn').addEventListener('click', () => this.leaveRoom());
        
        document.querySelectorAll('.primitive-btn').forEach(btn => {
            btn.addEventListener('click', () => this.createPrimitive(btn.dataset.type));
        });
        
        document.querySelectorAll('.transform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.transform-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setTransformMode(btn.dataset.mode);
            });
        });
        
        document.getElementById('applyColor').addEventListener('click', () => this.applyColor());
        document.getElementById('deleteObject').addEventListener('click', () => this.deleteSelected());
        
        document.getElementById('createGroupBtn').addEventListener('click', () => this.createGroup());
        document.getElementById('ungroupBtn').addEventListener('click', () => this.ungroup());
        
        this.updateConnectionStatus(false);
    }
    
    async joinRoom() {
        this.roomId = document.getElementById('roomId').value || 'default-room';
        this.userName = document.getElementById('userName').value || 'User';
        
        try {
            const url = `https://localhost:4433/webtransport`;
            this.webTransport = new WebTransport(url);
            
            this.webTransport.ready.then(() => {
                console.log('WebTransport connected');
                this.setupDataChannel();
            });
            
            this.webTransport.closed.then(() => {
                console.log('WebTransport closed');
                this.updateConnectionStatus(false);
            });
            
        } catch (e) {
            console.error('WebTransport connection failed:', e);
            alert('连接失败，请确保后端服务器正在运行');
        }
    }
    
    async setupDataChannel() {
        try {
            this.dataChannel = await this.webTransport.createBidirectionalStream();
            this.connected = true;
            this.updateConnectionStatus(true);
            
            document.getElementById('joinBtn').disabled = true;
            document.getElementById('leaveBtn').disabled = false;
            
            this.readFromDataChannel();
            
            this.sendJoinMessage();
            this.startLatencyCheck();
            
            await this.syncPendingOperations();
            
        } catch (e) {
            console.error('Data channel setup failed:', e);
            this.connected = false;
            this.updateConnectionStatus(false);
        }
    }
    
    async readFromDataChannel() {
        const reader = this.dataChannel.readable.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const msg = JSON.parse(line);
                            this.handleMessage(msg);
                        } catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Read error:', e);
        }
        
        this.connected = false;
        this.updateConnectionStatus(false);
    }
    
    sendMessage(msg) {
        if (!this.connected || !this.dataChannel) {
            this.addPendingOperation(msg);
            return false;
        }
        
        try {
            const writer = this.dataChannel.writable.getWriter();
            const data = JSON.stringify(msg) + '\n';
            writer.write(new TextEncoder().encode(data));
            writer.releaseLock();
            return true;
        } catch (e) {
            console.error('Send error:', e);
            this.addPendingOperation(msg);
            return false;
        }
    }
    
    handleMessage(msg) {
        switch (msg.type) {
            case 'welcome':
                this.userId = msg.userId;
                break;
                
            case 'scene_sync':
                this.syncScene(msg.payload);
                break;
                
            case 'locks_sync':
                this.syncLocks(msg.payload);
                break;
                
            case 'groups_sync':
                this.syncGroups(msg.payload);
                break;
                
            case 'join':
                this.addUser(msg.userId, msg.payload);
                break;
                
            case 'leave':
                this.removeUser(msg.userId);
                break;
                
            case 'lock_object':
                this.handleLockObject(msg.userId, msg.payload);
                break;
                
            case 'unlock_object':
                this.handleUnlockObject(msg.userId, msg.payload);
                break;
                
            case 'lock_denied':
                this.handleLockDenied(msg.payload);
                break;
                
            case 'create_object':
                if (msg.userId !== this.userId) {
                    this.remoteCreateObject(msg.payload);
                }
                break;
                
            case 'update_object':
                if (msg.userId !== this.userId) {
                    this.remoteUpdateObject(msg.payload);
                }
                break;
                
            case 'delete_object':
                if (msg.userId !== this.userId) {
                    this.remoteDeleteObject(msg.payload);
                }
                break;
                
            case 'create_group':
                if (msg.userId !== this.userId) {
                    this.remoteCreateGroup(msg.payload);
                }
                break;
                
            case 'update_group':
                if (msg.userId !== this.userId) {
                    this.remoteUpdateGroup(msg.payload);
                }
                break;
                
            case 'delete_group':
                if (msg.userId !== this.userId) {
                    this.remoteDeleteGroup(msg.payload);
                }
                break;
                
            case 'pong':
                this.latency = Date.now() - this.lastPingTime;
                document.getElementById('latency').textContent = `${this.latency} ms`;
                break;
        }
    }
    
    syncLocks(locksData) {
        for (const objId in locksData) {
            this.objectLocks.set(objId, locksData[objId]);
            const obj = this.objects.get(objId) || this.groups.get(objId);
            if (obj) {
                this.updateObjectVisualState(obj, true, locksData[objId] === this.userId);
            }
        }
    }
    
    syncGroups(groupsData) {
        for (const id in groupsData) {
            if (!this.groups.has(id)) {
                this.remoteCreateGroup(groupsData[id]);
            }
        }
    }
    
    handleLockObject(userId, payload) {
        this.objectLocks.set(payload.objectId, userId);
        const obj = this.objects.get(payload.objectId) || this.groups.get(payload.objectId);
        if (obj) {
            this.updateObjectVisualState(obj, true, userId === this.userId);
        }
        
        if (userId !== this.userId && this.selectedObject && 
            this.selectedObject.userData.id === payload.objectId) {
            this.deselectObject();
            const ownerName = this.roomUsers.get(userId)?.name || '其他用户';
            this.showLockMessage(`对象已被 ${ownerName} 锁定`);
        }
    }
    
    handleUnlockObject(userId, payload) {
        this.objectLocks.delete(payload.objectId);
        const obj = this.objects.get(payload.objectId) || this.groups.get(payload.objectId);
        if (obj) {
            this.updateObjectVisualState(obj, false, false);
        }
    }
    
    handleLockDenied(payload) {
        if (this.selectedObject && this.selectedObject.userData.id === payload.objectId) {
            this.transformControls.detach();
            this.isDragging = false;
            this.controls.enabled = true;
            
            const lockOwner = this.objectLocks.get(payload.objectId);
            const ownerName = this.roomUsers.get(lockOwner)?.name || '其他用户';
            this.showLockMessage(`对象正在被 ${ownerName} 编辑`);
        }
    }
    
    sendJoinMessage() {
        this.sendMessage({
            type: 'join',
            roomId: this.roomId,
            payload: { name: this.userName }
        });
    }
    
    leaveRoom() {
        if (this.connected) {
            if (this.selectedObject) {
                this.sendUnlockObject(this.selectedObject.userData.id);
            }
            
            this.sendMessage({
                type: 'leave',
                roomId: this.roomId
            });
            this.webTransport.close();
        }
        
        this.connected = false;
        this.dataChannel = null;
        this.userId = null;
        this.roomUsers.clear();
        this.objectLocks.clear();
        this.isDragging = false;
        
        this.objects.forEach((obj) => {
            this.updateObjectVisualState(obj, false, false);
        });
        
        document.getElementById('joinBtn').disabled = false;
        document.getElementById('leaveBtn').disabled = true;
        this.updateUsersList();
        this.updateConnectionStatus(false);
    }
    
    createPrimitive(type) {
        const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        let geometry;
        switch (type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.5, 32, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(2, 2);
                break;
        }
        
        const color = document.getElementById('colorPicker').value;
        const material = new THREE.MeshStandardMaterial({
            color: parseInt(color.replace('#', ''), 16),
            metalness: 0.3,
            roughness: 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            (Math.random() - 0.5) * 4,
            0.5 + Math.random() * 2,
            (Math.random() - 0.5) * 4
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.userData = {
            id,
            type,
            color: color,
            position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
            rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
            scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z }
        };
        
        this.scene.add(mesh);
        this.objects.set(id, mesh);
        
        this.selectObject(mesh);
        this.updateObjectList();
        this.saveObjectToDB(mesh.userData);
        
        this.sendMessage({
            type: 'create_object',
            roomId: this.roomId,
            payload: mesh.userData
        });
    }
    
    remoteCreateObject(data) {
        let geometry;
        switch (data.type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.5, 32, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(2, 2);
                break;
        }
        
        const material = new THREE.MeshStandardMaterial({
            color: parseInt(data.color.replace('#', ''), 16),
            metalness: 0.3,
            roughness: 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(data.position.x, data.position.y, data.position.z);
        mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = data;
        
        this.scene.add(mesh);
        this.objects.set(data.id, mesh);
        this.updateObjectList();
        this.saveObjectToDB(data);
    }
    
    syncObjectUpdate(obj) {
        const data = obj.userData;
        data.position = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
        data.rotation = { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z };
        data.scale = { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z };
        
        this.sendMessage({
            type: 'update_object',
            roomId: this.roomId,
            payload: data
        });
    }
    
    remoteUpdateObject(data) {
        const obj = this.objects.get(data.id);
        if (!obj) return;
        
        obj.position.set(data.position.x, data.position.y, data.position.z);
        obj.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        obj.scale.set(data.scale.x, data.scale.y, data.scale.z);
        obj.userData = data;
        
        this.saveObjectToDB(data);
    }
    
    deleteSelected() {
        if (!this.selectedObject) return;
        
        const objId = this.selectedObject.userData.id;
        const lockOwner = this.objectLocks.get(objId);
        
        if (lockOwner && lockOwner !== this.userId) {
            const ownerName = this.roomUsers.get(lockOwner)?.name || '其他用户';
            this.showLockMessage(`对象正在被 ${ownerName} 编辑`);
            return;
        }
        
        const id = objId;
        const isGroup = this.selectedObject.userData.type === 'group';
        
        this.transformControls.detach();
        this.scene.remove(this.selectedObject);
        
        if (isGroup) {
            this.groups.delete(id);
            this.deleteGroupFromDB(id);
        } else {
            this.objects.delete(id);
            this.deleteObjectFromDB(id);
        }
        
        this.selectedObject = null;
        this.selectedGroup = null;
        
        this.updateObjectList();
        
        document.getElementById('applyColor').disabled = true;
        document.getElementById('deleteObject').disabled = true;
        
        this.sendMessage({
            type: isGroup ? 'delete_group' : 'delete_object',
            roomId: this.roomId,
            payload: { id }
        });
    }
    
    remoteDeleteObject(data) {
        const obj = this.objects.get(data.id);
        if (!obj) return;
        
        if (this.selectedObject === obj) {
            this.transformControls.detach();
            this.selectedObject = null;
            document.getElementById('applyColor').disabled = true;
            document.getElementById('deleteObject').disabled = true;
        }
        
        this.scene.remove(obj);
        this.objects.delete(data.id);
        this.updateObjectList();
        this.deleteObjectFromDB(data.id);
    }
    
    selectObject(obj) {
        const objId = obj.userData.id;
        const lockOwner = this.objectLocks.get(objId);
        
        if (lockOwner && lockOwner !== this.userId) {
            const ownerName = this.roomUsers.get(lockOwner)?.name || '其他用户';
            this.showLockMessage(`对象正在被 ${ownerName} 编辑`);
            return;
        }
        
        this.deselectAll();
        this.selectedObject = obj;
        this.transformControls.attach(obj);
        
        if (obj.userData.type === 'group') {
            this.selectedGroup = obj;
            document.getElementById('applyColor').disabled = true;
        } else {
            this.selectedGroup = null;
            document.getElementById('colorPicker').value = obj.userData.color;
            document.getElementById('applyColor').disabled = false;
        }
        
        document.getElementById('deleteObject').disabled = false;
        
        this.updateSelectionInfo();
        this.updateObjectList();
    }
    
    deselectObject() {
        if (this.selectedObject && this.isDragging) {
            this.sendUnlockObject(this.selectedObject.userData.id);
        }
        
        this.transformControls.detach();
        this.selectedObject = null;
        
        document.getElementById('applyColor').disabled = true;
        document.getElementById('deleteObject').disabled = true;
        
        this.updateObjectList();
    }
    
    toggleObjectSelection(obj) {
        const objId = obj.userData.id;
        
        if (this.selectedObjects.has(objId)) {
            this.selectedObjects.delete(objId);
            this.resetObjectHighlight(obj);
        } else {
            const lockOwner = this.objectLocks.get(objId);
            if (lockOwner && lockOwner !== this.userId) {
                const ownerName = this.roomUsers.get(lockOwner)?.name || '其他用户';
                this.showLockMessage(`对象正在被 ${ownerName} 编辑`);
                return;
            }
            this.selectedObjects.add(objId);
            this.highlightObject(obj);
        }
        
        this.updateSelectionInfo();
        this.updateObjectList();
    }
    
    deselectAll() {
        this.selectedObjects.forEach(objId => {
            const obj = this.objects.get(objId) || this.groups.get(objId);
            if (obj) this.resetObjectHighlight(obj);
        });
        
        this.selectedObjects.clear();
        this.deselectObject();
        this.selectedGroup = null;
        this.updateSelectionInfo();
        this.updateObjectList();
    }
    
    highlightObject(obj) {
        if (obj.material && !obj.userData.originalEmissive) {
            obj.userData.originalEmissive = obj.material.emissive.getHex();
            obj.material.emissive.setHex(0x333333);
        }
    }
    
    resetObjectHighlight(obj) {
        if (obj.material && obj.userData.originalEmissive !== undefined) {
            obj.material.emissive.setHex(obj.userData.originalEmissive);
            delete obj.userData.originalEmissive;
        }
    }
    
    updateSelectionInfo() {
        const info = document.getElementById('selectionInfo');
        const count = this.selectedObjects.size;
        
        if (count === 0) {
            info.textContent = '未选择任何对象';
        } else if (count === 1) {
            const objId = Array.from(this.selectedObjects)[0];
            const obj = this.objects.get(objId) || this.groups.get(objId);
            const type = obj?.userData?.type || '对象';
            info.textContent = `已选择: ${type} (${objId.substr(-6)})`;
        } else {
            info.textContent = `已选择 ${count} 个对象`;
        }
        
        document.getElementById('createGroupBtn').disabled = count < 2;
        document.getElementById('ungroupBtn').disabled = !this.selectedGroup;
    }
    
    createGroup() {
        if (this.selectedObjects.size < 2) return;
        
        const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const group = new THREE.Group();
        group.userData = {
            id: groupId,
            type: 'group',
            children: Array.from(this.selectedObjects),
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        };
        
        const center = new THREE.Vector3();
        const children = [];
        
        this.selectedObjects.forEach(objId => {
            const obj = this.objects.get(objId);
            if (obj) {
                children.push(obj);
                center.add(obj.position);
            }
        });
        
        center.divideScalar(children.length);
        group.position.copy(center);
        group.userData.position = { x: center.x, y: center.y, z: center.z };
        
        this.scene.add(group);
        this.groups.set(groupId, group);
        
        children.forEach(obj => {
            this.scene.remove(obj);
            group.attach(obj);
            obj.userData.parentGroup = groupId;
        });
        
        this.selectedObjects.clear();
        this.selectedGroup = group;
        this.selectedObject = group;
        this.transformControls.attach(group);
        
        this.sendMessage({
            type: 'create_group',
            roomId: this.roomId,
            payload: group.userData
        });
        
        this.saveGroupToDB(group.userData);
        this.updateObjectList();
        this.updateSelectionInfo();
    }
    
    ungroup() {
        if (!this.selectedGroup) return;
        
        const group = this.selectedGroup;
        const groupId = group.userData.id;
        const children = [...group.children];
        
        children.forEach(child => {
            group.remove(child);
            child.userData.parentGroup = null;
            
            const worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            const worldRot = new THREE.Quaternion();
            child.getWorldQuaternion(worldRot);
            const worldScale = new THREE.Vector3();
            child.getWorldScale(worldScale);
            
            child.position.copy(worldPos);
            child.quaternion.copy(worldRot);
            child.scale.copy(worldScale);
            
            child.userData.position = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
            child.userData.rotation = { x: child.rotation.x, y: child.rotation.y, z: child.rotation.z };
            child.userData.scale = { x: worldScale.x, y: worldScale.y, z: worldScale.z };
            
            this.scene.attach(child);
        });
        
        this.scene.remove(group);
        this.groups.delete(groupId);
        
        this.transformControls.detach();
        this.selectedGroup = null;
        this.selectedObject = null;
        
        this.sendMessage({
            type: 'delete_group',
            roomId: this.roomId,
            payload: { id: groupId }
        });
        
        this.deleteGroupFromDB(groupId);
        this.updateObjectList();
        this.updateSelectionInfo();
    }
    
    remoteCreateGroup(data) {
        const group = new THREE.Group();
        group.userData = {
            id: data.id,
            type: 'group',
            children: data.children,
            position: data.position,
            rotation: data.rotation,
            scale: data.scale
        };
        
        group.position.set(data.position.x, data.position.y, data.position.z);
        group.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        group.scale.set(data.scale.x, data.scale.y, data.scale.z);
        
        this.scene.add(group);
        this.groups.set(data.id, group);
        
        data.children.forEach(childId => {
            const child = this.objects.get(childId);
            if (child) {
                this.scene.remove(child);
                group.attach(child);
                child.userData.parentGroup = data.id;
            }
        });
        
        this.saveGroupToDB(data);
        this.updateObjectList();
    }
    
    remoteUpdateGroup(data) {
        const group = this.groups.get(data.id);
        if (!group) return;
        
        group.position.set(data.position.x, data.position.y, data.position.z);
        group.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        group.scale.set(data.scale.x, data.scale.y, data.scale.z);
        group.userData = data;
        
        this.saveGroupToDB(data);
    }
    
    remoteDeleteGroup(data) {
        const group = this.groups.get(data.id);
        if (!group) return;
        
        const children = [...group.children];
        
        children.forEach(child => {
            group.remove(child);
            child.userData.parentGroup = null;
            
            const worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            const worldRot = new THREE.Quaternion();
            child.getWorldQuaternion(worldRot);
            const worldScale = new THREE.Vector3();
            child.getWorldScale(worldScale);
            
            child.position.copy(worldPos);
            child.quaternion.copy(worldRot);
            child.scale.copy(worldScale);
            
            child.userData.position = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
            child.userData.rotation = { x: child.rotation.x, y: child.rotation.y, z: child.rotation.z };
            child.userData.scale = { x: worldScale.x, y: worldScale.y, z: worldScale.z };
            
            this.scene.attach(child);
        });
        
        this.scene.remove(group);
        this.groups.delete(data.id);
        
        if (this.selectedGroup === group) {
            this.transformControls.detach();
            this.selectedGroup = null;
            this.selectedObject = null;
        }
        
        this.deleteGroupFromDB(data.id);
        this.updateObjectList();
    }
    
    syncGroupUpdate(group) {
        const data = group.userData;
        data.position = { x: group.position.x, y: group.position.y, z: group.position.z };
        data.rotation = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
        data.scale = { x: group.scale.x, y: group.scale.y, z: group.scale.z };
        
        this.sendMessage({
            type: 'update_group',
            roomId: this.roomId,
            payload: data
        });
    }
    
    sendLockObject(objectId) {
        if (!this.connected) return;
        
        this.sendMessage({
            type: 'lock_object',
            roomId: this.roomId,
            payload: { objectId }
        });
    }
    
    sendUnlockObject(objectId) {
        if (!this.connected) return;
        
        this.sendMessage({
            type: 'unlock_object',
            roomId: this.roomId,
            payload: { objectId }
        });
    }
    
    showLockMessage(message) {
        const badge = document.getElementById('connectionBadge');
        const originalText = badge.textContent;
        const originalClass = badge.className;
        
        badge.className = 'connection-status disconnected';
        badge.textContent = message;
        
        setTimeout(() => {
            badge.className = originalClass;
            badge.textContent = originalText;
        }, 2000);
    }
    
    updateObjectVisualState(obj, isLocked, isOwnedByMe) {
        const objId = obj.userData.id;
        
        if (isLocked && !isOwnedByMe) {
            if (!this.originalMaterials.has(objId)) {
                this.originalMaterials.set(objId, obj.material.clone());
            }
            obj.material = new THREE.MeshStandardMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.5,
                metalness: 0.3,
                roughness: 0.7
            });
        } else {
            if (this.originalMaterials.has(objId)) {
                obj.material = this.originalMaterials.get(objId);
                this.originalMaterials.delete(objId);
            }
        }
    }
    
    setTransformMode(mode) {
        this.currentMode = mode;
        this.transformControls.setMode(mode);
    }
    
    applyColor() {
        if (!this.selectedObject) return;
        
        const objId = this.selectedObject.userData.id;
        const lockOwner = this.objectLocks.get(objId);
        
        if (lockOwner && lockOwner !== this.userId) {
            const ownerName = this.roomUsers.get(lockOwner)?.name || '其他用户';
            this.showLockMessage(`对象正在被 ${ownerName} 编辑`);
            return;
        }
        
        const color = document.getElementById('colorPicker').value;
        this.selectedObject.material.color.set(parseInt(color.replace('#', ''), 16));
        this.selectedObject.userData.color = color;
        
        this.syncObjectUpdate(this.selectedObject);
        this.saveObjectToDB(this.selectedObject.userData);
    }
    
    syncScene(sceneData) {
        for (const id in sceneData) {
            if (!this.objects.has(id)) {
                this.remoteCreateObject(sceneData[id]);
            }
        }
        document.getElementById('syncStatus').textContent = '已同步';
    }
    
    updateObjectList() {
        const list = document.getElementById('objectList');
        list.innerHTML = '';
        
        this.groups.forEach((group, groupId) => {
            const groupItem = document.createElement('div');
            groupItem.className = `group-item ${this.selectedGroup === group ? 'selected' : ''}`;
            groupItem.innerHTML = `
                <span>📦 组 - ${groupId.substr(-6)}</span>
                <span class="delete-icon" data-id="${groupId}">×</span>
            `;
            groupItem.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-icon')) {
                    this.selectObject(group);
                    this.ungroup();
                } else {
                    this.selectObject(group);
                }
            });
            list.appendChild(groupItem);
            
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'group-children';
            
            group.userData.children.forEach(childId => {
                const obj = this.objects.get(childId);
                if (obj) {
                    const item = document.createElement('div');
                    item.className = `object-item ${this.selectedObject === obj ? 'selected' : ''}`;
                    item.innerHTML = `
                        <span>${obj.userData.type} - ${childId.substr(-6)}</span>
                    `;
                    item.addEventListener('click', () => this.selectObject(obj));
                    childrenContainer.appendChild(item);
                }
            });
            
            list.appendChild(childrenContainer);
        });
        
        this.objects.forEach((obj, id) => {
            if (obj.userData.parentGroup) return;
            
            const item = document.createElement('div');
            item.className = `object-item ${this.selectedObject === obj ? 'selected' : ''}`;
            item.innerHTML = `
                <span>${obj.userData.type} - ${id.substr(-6)}</span>
                <span class="delete-icon" data-id="${id}">×</span>
            `;
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-icon')) {
                    this.selectObject(obj);
                    this.deleteSelected();
                } else {
                    this.selectObject(obj);
                }
            });
            list.appendChild(item);
        });
    }
    
    addUser(userId, data) {
        this.roomUsers.set(userId, data || { name: 'Unknown' });
        this.updateUsersList();
    }
    
    removeUser(userId) {
        this.roomUsers.delete(userId);
        this.updateUsersList();
    }
    
    updateUsersList() {
        const list = document.getElementById('usersList');
        list.innerHTML = '';
        
        this.roomUsers.forEach((data, userId) => {
            const item = document.createElement('div');
            item.className = 'user-item';
            item.innerHTML = `
                <span class="user-dot"></span>
                <span>${data.name || 'Unknown'}</span>
            `;
            list.appendChild(item);
        });
    }
    
    updateConnectionStatus(connected) {
        const badge = document.getElementById('connectionBadge');
        const status = document.getElementById('connectionStatus');
        
        if (connected) {
            badge.className = 'connection-status connected';
            badge.textContent = '已连接';
            status.className = 'online';
            status.textContent = '已连接';
            document.getElementById('syncStatus').textContent = '在线';
        } else {
            badge.className = 'connection-status disconnected';
            badge.textContent = '未连接';
            status.className = 'offline';
            status.textContent = '未连接';
            document.getElementById('syncStatus').textContent = '离线';
        }
    }
    
    startLatencyCheck() {
        setInterval(() => {
            if (this.connected) {
                this.lastPingTime = Date.now();
                this.sendMessage({ type: 'ping' });
            }
        }, 2000);
    }
    
    async saveObjectToDB(data) {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            const tx = this.db.transaction(['sceneObjects'], 'readwrite');
            tx.objectStore('sceneObjects').put(data);
            tx.oncomplete = () => resolve();
        });
    }
    
    async deleteObjectFromDB(id) {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            const tx = this.db.transaction(['sceneObjects'], 'readwrite');
            tx.objectStore('sceneObjects').delete(id);
            tx.oncomplete = () => resolve();
        });
    }
    
    async saveGroupToDB(data) {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            const tx = this.db.transaction(['sceneGroups'], 'readwrite');
            tx.objectStore('sceneGroups').put(data);
            tx.oncomplete = () => resolve();
        });
    }
    
    async deleteGroupFromDB(id) {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            const tx = this.db.transaction(['sceneGroups'], 'readwrite');
            tx.objectStore('sceneGroups').delete(id);
            tx.oncomplete = () => resolve();
        });
    }
    
    async loadSceneFromDB() {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            const tx = this.db.transaction(['sceneObjects', 'sceneGroups'], 'readonly');
            
            const objectsStore = tx.objectStore('sceneObjects');
            const objectsRequest = objectsStore.getAll();
            
            const groupsStore = tx.objectStore('sceneGroups');
            const groupsRequest = groupsStore.getAll();
            
            let loadedObjects = [];
            let loadedGroups = [];
            let completed = 0;
            
            const checkComplete = () => {
                if (++completed === 2) {
                    loadedObjects.forEach(data => {
                        if (!this.objects.has(data.id)) {
                            this.remoteCreateObject(data);
                        }
                    });
                    loadedGroups.forEach(data => {
                        if (!this.groups.has(data.id)) {
                            this.remoteCreateGroup(data);
                        }
                    });
                    resolve();
                }
            };
            
            objectsRequest.onsuccess = () => {
                loadedObjects = objectsRequest.result;
                checkComplete();
            };
            
            groupsRequest.onsuccess = () => {
                loadedGroups = groupsRequest.result;
                checkComplete();
            };
        });
    }
    
    async addPendingOperation(msg) {
        this.pendingOperations.push({
            ...msg,
            timestamp: Date.now()
        });
        
        if (this.db) {
            const tx = this.db.transaction(['pendingOps'], 'readwrite');
            tx.objectStore('pendingOps').put({
                timestamp: Date.now(),
                operation: msg
            });
        }
    }
    
    async syncPendingOperations() {
        if (!this.db || !this.connected) return;
        
        const tx = this.db.transaction(['pendingOps'], 'readwrite');
        const store = tx.objectStore('pendingOps');
        const request = store.getAll();
        
        request.onsuccess = () => {
            request.result.forEach(item => {
                this.sendMessage(item.operation);
                store.delete(item.timestamp);
            });
        };
    }
    
    onResize() {
        const viewport = document.getElementById('viewport');
        this.camera.aspect = viewport.clientWidth / viewport.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Collab3DEditor();
});
