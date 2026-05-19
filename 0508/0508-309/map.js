class RideMap {
    constructor() {
        this.map = null;
        this.playbackMap = null;
        this.track = [];
        this.smoothedTrack = [];
        this.polyline = null;
        this.marker = null;
        this.watchId = null;
        this.isTracking = false;
        this.positionListeners = [];
        
        this.lastPosition = null;
        this.lastValidPosition = null;
        this.kalmanFilter = null;
        this.maxAccuracy = 20;
        this.smoothingWindow = 5;
        this.predictionInterval = null;
        this.currentSpeed = 0;
        this.currentHeading = 0;
    }

    initMap() {
        this.map = L.map('map').setView([39.9042, 116.4074], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.polyline = L.polyline([], {
            color: '#667eea',
            weight: 4,
            opacity: 0.8
        }).addTo(this.map);

        this.marker = L.marker([39.9042, 116.4074]).addTo(this.map);
    }

    initPlaybackMap() {
        this.playbackMap = L.map('playbackMap').setView([39.9042, 116.4074], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.playbackMap);
    }

    addPositionListener(callback) {
        this.positionListeners.push(callback);
    }

    notifyPositionListeners(position) {
        this.positionListeners.forEach(callback => callback(position));
    }

    initKalmanFilter() {
        this.kalmanFilter = {
            x: 0,
            y: 0,
            variance: 1000,
            processNoise: 0.001,
            measurementNoise: 1
        };
    }

    applyKalmanFilter(lat, lng, accuracy) {
        if (!this.kalmanFilter) {
            this.initKalmanFilter();
            this.kalmanFilter.x = lat;
            this.kalmanFilter.y = lng;
            return { lat, lng };
        }

        const measurementVariance = Math.pow(accuracy / 111000, 2);
        
        this.kalmanFilter.variance += this.kalmanFilter.processNoise;
        const gain = this.kalmanFilter.variance / (this.kalmanFilter.variance + measurementVariance);
        
        this.kalmanFilter.x += gain * (lat - this.kalmanFilter.x);
        this.kalmanFilter.y += gain * (lng - this.kalmanFilter.y);
        this.kalmanFilter.variance *= (1 - gain);

        return {
            lat: this.kalmanFilter.x,
            lng: this.kalmanFilter.y
        };
    }

    movingAverageSmooth(newPoint) {
        this.smoothedTrack.push(newPoint);
        
        if (this.smoothedTrack.length < this.smoothingWindow) {
            return newPoint;
        }

        if (this.smoothedTrack.length > this.smoothingWindow * 2) {
            this.smoothedTrack = this.smoothedTrack.slice(-this.smoothingWindow * 2);
        }

        const recentPoints = this.smoothedTrack.slice(-this.smoothingWindow);
        const avgLat = recentPoints.reduce((sum, p) => sum + p.lat, 0) / recentPoints.length;
        const avgLng = recentPoints.reduce((sum, p) => sum + p.lng, 0) / recentPoints.length;

        return {
            ...newPoint,
            lat: avgLat,
            lng: avgLng
        };
    }

    calculateHeading(from, to) {
        const fromLat = this.toRad(from.lat);
        const fromLng = this.toRad(from.lng);
        const toLat = this.toRad(to.lat);
        const toLng = this.toRad(to.lng);

        const dLng = toLng - fromLng;

        const y = Math.sin(dLng) * Math.cos(toLat);
        const x = Math.cos(fromLat) * Math.sin(toLat) -
                  Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
        let heading = Math.atan2(y, x);

        heading = (heading * 180 / Math.PI + 360) % 360;
        return heading;
    }

    toRad(deg) {
        return deg * (Math.PI / 180);
    }

    toDeg(rad) {
        return rad * (180 / Math.PI);
    }

    predictPosition(lastPoint, speedKmh, heading, timeSeconds) {
        const speedMs = speedKmh / 3.6;
        const distance = speedMs * timeSeconds;
        
        const lat = this.toRad(lastPoint.lat);
        const lng = this.toRad(lastPoint.lng);
        const headingRad = this.toRad(heading);
        const R = 6371000;

        const newLat = Math.asin(
            Math.sin(lat) * Math.cos(distance / R) +
            Math.cos(lat) * Math.sin(distance / R) * Math.cos(headingRad)
        );

        const newLng = lng + Math.atan2(
            Math.sin(headingRad) * Math.sin(distance / R) * Math.cos(lat),
            Math.cos(distance / R) - Math.sin(lat) * Math.sin(newLat)
        );

        return {
            lat: this.toDeg(newLat),
            lng: this.toDeg(newLng)
        };
    }

    startDeadReckoning() {
        let lastUpdateTime = Date.now();
        
        this.predictionInterval = setInterval(() => {
            if (!this.isTracking || !this.lastValidPosition) return;
            
            const now = Date.now();
            const elapsed = (now - lastUpdateTime) / 1000;
            
            if (elapsed > 0.1 && this.currentSpeed > 0.5) {
                const predicted = this.predictPosition(
                    this.lastValidPosition,
                    this.currentSpeed,
                    this.currentHeading,
                    elapsed
                );

                const predictedPoint = {
                    ...this.lastValidPosition,
                    lat: predicted.lat,
                    lng: predicted.lng,
                    timestamp: now,
                    isPredicted: true
                };

                this.updateMap(predictedPoint);
            }
            
            lastUpdateTime = now;
        }, 100);
    }

    startTracking() {
        if (!navigator.geolocation) {
            alert('您的浏览器不支持地理定位');
            return false;
        }

        this.isTracking = true;
        this.track = [];
        this.smoothedTrack = [];
        this.lastPosition = null;
        this.lastValidPosition = null;
        this.kalmanFilter = null;
        this.updateGpsStatus(true);

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePosition(position),
            (error) => this.handlePositionError(error),
            {
                enableHighAccuracy: true,
                timeout: 2000,
                maximumAge: 0
            }
        );

        this.startDeadReckoning();

        return true;
    }

    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        if (this.predictionInterval !== null) {
            clearInterval(this.predictionInterval);
            this.predictionInterval = null;
        }
        this.isTracking = false;
        this.updateGpsStatus(false);
    }

    updateSpeed(speed) {
        this.currentSpeed = speed;
    }

    handlePosition(position) {
        const { latitude, longitude, speed, altitude, accuracy, heading } = position.coords;
        
        this.updateGpsStatus(true, '', accuracy);
        
        if (accuracy > this.maxAccuracy) {
            console.log(`GPS精度不足: ${accuracy}m，跳过此点`);
            return;
        }

        let filtered = this.applyKalmanFilter(latitude, longitude, accuracy);
        
        const rawPoint = {
            lat: latitude,
            lng: longitude,
            speed: speed ? speed * 3.6 : 0,
            altitude: altitude || 0,
            accuracy: accuracy || 0,
            timestamp: position.timestamp
        };

        const smoothed = this.movingAverageSmooth({
            lat: filtered.lat,
            lng: filtered.lng,
            speed: speed ? speed * 3.6 : 0,
            altitude: altitude || 0,
            accuracy: accuracy || 0,
            timestamp: position.timestamp
        });

        if (this.lastValidPosition) {
            const dist = this.calculateDistance(
                this.lastValidPosition.lat, this.lastValidPosition.lng,
                smoothed.lat, smoothed.lng
            );
            const timeDiff = (smoothed.timestamp - this.lastValidPosition.timestamp) / 1000;
            
            if (timeDiff > 0) {
                const calculatedSpeed = (dist / timeDiff) * 3.6;
                if (calculatedSpeed > 100) {
                    console.log(`异常速度检测: ${calculatedSpeed.toFixed(1)} km/h，跳过此点`);
                    return;
                }
            }

            this.currentHeading = this.calculateHeading(this.lastValidPosition, smoothed);
        }

        if (speed !== null) {
            this.currentSpeed = speed * 3.6;
        }

        this.lastPosition = rawPoint;
        this.lastValidPosition = smoothed;

        this.track.push(smoothed);
        this.notifyPositionListeners(smoothed);
        this.updateMap(smoothed);
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000;
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    handlePositionError(error) {
        console.error('定位错误:', error);
        this.updateGpsStatus(false, error.message);
    }

    updateMap(point) {
        if (!this.map) return;

        const latLng = [point.lat, point.lng];
        this.marker.setLatLng(latLng);

        if (!point.isPredicted) {
            this.polyline.addLatLng(latLng);
        }
        
        this.map.panTo(latLng);
    }

    updateGpsStatus(connected, message = '', accuracy = null) {
        const statusEl = document.getElementById('gpsStatus');
        const accuracyEl = document.getElementById('gpsAccuracy');
        const qualityEl = document.getElementById('trackQuality');

        if (statusEl) {
            if (connected) {
                statusEl.textContent = '已定位';
                statusEl.className = 'status connected';
            } else {
                statusEl.textContent = message || '未定位';
                statusEl.className = 'status disconnected';
            }
        }

        if (accuracyEl) {
            if (accuracy !== null) {
                accuracyEl.textContent = `${accuracy.toFixed(1)} m`;
                
                if (accuracy <= 5) {
                    accuracyEl.style.color = '#155724';
                } else if (accuracy <= 15) {
                    accuracyEl.style.color = '#856404';
                } else {
                    accuracyEl.style.color = '#721c24';
                }
            } else {
                accuracyEl.textContent = '-- m';
                accuracyEl.style.color = '';
            }
        }

        if (qualityEl) {
            if (accuracy !== null) {
                let quality = '优秀';
                let qualityClass = 'connected';
                
                if (accuracy > 5 && accuracy <= 10) {
                    quality = '良好';
                } else if (accuracy > 10 && accuracy <= 20) {
                    quality = '一般';
                    qualityClass = '';
                } else if (accuracy > 20) {
                    quality = '较差';
                    qualityClass = 'disconnected';
                }
                
                qualityEl.textContent = quality;
                qualityEl.className = `status ${qualityClass}`;
            } else {
                qualityEl.textContent = '--';
                qualityEl.className = 'status disconnected';
            }
        }
    }

    getTrack() {
        return [...this.track];
    }

    drawPlaybackTrack(track) {
        if (!this.playbackMap) {
            this.initPlaybackMap();
        }

        this.playbackMap.eachLayer((layer) => {
            if (layer instanceof L.Polyline || layer instanceof L.Marker) {
                this.playbackMap.removeLayer(layer);
            }
        });

        if (track.length > 0) {
            const latLngs = track.map(p => [p.lat, p.lng]);
            L.polyline(latLngs, {
                color: '#667eea',
                weight: 4,
                opacity: 0.8
            }).addTo(this.playbackMap);

            this.playbackMarker = L.marker(latLngs[0]).addTo(this.playbackMap);
            this.playbackMap.fitBounds(L.latLngBounds(latLngs));
        }
    }

    updatePlaybackPosition(point) {
        if (this.playbackMarker && point) {
            this.playbackMarker.setLatLng([point.lat, point.lng]);
            this.playbackMap.panTo([point.lat, point.lng]);
        }
    }

    clearTrack() {
        this.track = [];
        if (this.polyline) {
            this.polyline.setLatLngs([]);
        }
    }

    resizePlaybackMap() {
        if (this.playbackMap) {
            setTimeout(() => {
                this.playbackMap.invalidateSize();
            }, 100);
        }
    }
}

const rideMap = new RideMap();