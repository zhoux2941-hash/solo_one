let currentTaskId = null;
let isCancelled = false;

self.onmessage = function(e) {
    const { type, taskId, pattern, flags, text } = e.data;

    if (type === 'cancel') {
        isCancelled = true;
        return;
    }

    if (type === 'match') {
        currentTaskId = taskId;
        isCancelled = false;
        performMatch(pattern, flags, text, taskId);
    }
};

function performMatch(pattern, flags, text, taskId) {
    try {
        const regex = new RegExp(pattern, flags);
        const results = [];
        const textLength = text.length;
        const chunkSize = 10000;
        
        let match;
        let count = 0;
        let lastProgress = 0;
        const startTime = Date.now();

        self.postMessage({
            type: 'start',
            taskId: taskId,
            totalLength: textLength
        });

        if (flags.includes('g')) {
            while ((match = regex.exec(text)) !== null) {
                if (isCancelled || currentTaskId !== taskId) {
                    self.postMessage({
                        type: 'cancelled',
                        taskId: taskId
                    });
                    return;
                }

                const groups = [];
                for (let i = 1; i < match.length; i++) {
                    if (match[i] !== undefined) {
                        groups.push({
                            index: i,
                            value: match[i]
                        });
                    }
                }

                results.push({
                    index: count,
                    match: match[0],
                    start: match.index,
                    end: match.index + match[0].length,
                    groups: groups
                });

                count++;

                if (count % 100 === 0) {
                    const progress = Math.floor((regex.lastIndex / textLength) * 100);
                    if (progress > lastProgress) {
                        lastProgress = progress;
                        self.postMessage({
                            type: 'progress',
                            taskId: taskId,
                            progress: progress,
                            matchCount: count
                        });
                    }

                    const elapsed = Date.now() - startTime;
                    if (elapsed > 50) {
                        setTimeout(() => {}, 0);
                    }
                }

                if (match[0].length === 0) {
                    regex.lastIndex++;
                }
            }
        } else {
            match = regex.exec(text);
            if (match !== null) {
                const groups = [];
                for (let i = 1; i < match.length; i++) {
                    if (match[i] !== undefined) {
                        groups.push({
                            index: i,
                            value: match[i]
                        });
                    }
                }

                results.push({
                    index: 0,
                    match: match[0],
                    start: match.index,
                    end: match.index + match[0].length,
                    groups: groups
                });
                count = 1;
            }
        }

        self.postMessage({
            type: 'complete',
            taskId: taskId,
            results: results,
            matchCount: count,
            duration: Date.now() - startTime
        });

    } catch (error) {
        self.postMessage({
            type: 'error',
            taskId: taskId,
            error: error.message
        });
    }
}
