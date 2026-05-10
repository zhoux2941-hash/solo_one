import numpy as np


class HistoryManager:
    def __init__(self, max_history=50):
        self.max_history = max_history
        self.undo_stack = []
        self.redo_stack = []
    
    def can_undo(self):
        return len(self.undo_stack) > 0
    
    def can_redo(self):
        return len(self.redo_stack) > 0
    
    def push(self, state):
        self.undo_stack.append(state.copy())
        if len(self.undo_stack) > self.max_history:
            self.undo_stack.pop(0)
        self.redo_stack.clear()
    
    def undo(self, current_state):
        if not self.can_undo():
            return None
        prev_state = self.undo_stack.pop()
        self.redo_stack.append(current_state.copy())
        return prev_state
    
    def redo(self, current_state):
        if not self.can_redo():
            return None
        next_state = self.redo_stack.pop()
        self.undo_stack.append(current_state.copy())
        return next_state
    
    def clear(self):
        self.undo_stack.clear()
        self.redo_stack.clear()
    
    def set_max_history(self, max_history):
        self.max_history = max_history
        while len(self.undo_stack) > self.max_history:
            self.undo_stack.pop(0)
