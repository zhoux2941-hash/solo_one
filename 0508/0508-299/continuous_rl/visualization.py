import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from matplotlib.patches import Rectangle


class Visualizer:
    def __init__(self, env=None):
        self.env = env
        self.fig = None
        self.axes = None

    def plot_trajectory(self, ego_x, ego_y, lead_x, lead_y=None, save_path=None):
        if lead_y is None:
            lead_y = np.zeros_like(lead_x)
        
        fig, ax = plt.subplots(figsize=(12, 6))
        
        ax.axhline(y=0, color='gray', linestyle='--', alpha=0.5, label='Lane 1')
        ax.axhline(y=3.5, color='gray', linestyle='--', alpha=0.5, label='Lane 2')
        ax.axhline(y=7.0, color='gray', linestyle='--', alpha=0.5)
        
        ax.plot(ego_x, ego_y, 'b-', linewidth=2, label='Ego Vehicle')
        ax.plot(lead_x, lead_y, 'r-', linewidth=2, label='Lead Vehicle')
        
        ax.scatter(ego_x[-1], ego_y[-1], color='blue', s=100, zorder=5)
        ax.scatter(lead_x[-1], lead_y[-1], color='red', s=100, zorder=5)
        
        ax.set_xlabel('Position X (m)', fontsize=12)
        ax.set_ylabel('Position Y (m)', fontsize=12)
        ax.set_title('Vehicle Trajectory', fontsize=14)
        ax.legend()
        ax.grid(True, alpha=0.3)
        ax.set_ylim(-1, 8)
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=300)
        plt.show()

    def plot_states(self, trajectory, dt=0.01, save_path=None):
        time = np.arange(len(trajectory)) * dt
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        
        axes[0, 0].plot(time, trajectory[:, 0], 'b-', label='Ego X')
        axes[0, 0].plot(time, trajectory[:, 6], 'r-', label='Lead X')
        axes[0, 0].set_xlabel('Time (s)')
        axes[0, 0].set_ylabel('Position (m)')
        axes[0, 0].set_title('Longitudinal Position')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        axes[0, 1].plot(time, trajectory[:, 1], 'b-', label='Ego Speed')
        axes[0, 1].plot(time, trajectory[:, 7], 'r-', label='Lead Speed')
        axes[0, 1].set_xlabel('Time (s)')
        axes[0, 1].set_ylabel('Velocity (m/s)')
        axes[0, 1].set_title('Velocity Profile')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        axes[1, 0].plot(time, trajectory[:, 4], 'g-')
        axes[1, 0].set_xlabel('Time (s)')
        axes[1, 0].set_ylabel('Lateral Position (m)')
        axes[1, 0].set_title('Lane Change Trajectory')
        axes[1, 0].axhline(y=0, color='gray', linestyle='--', alpha=0.5)
        axes[1, 0].axhline(y=3.5, color='gray', linestyle='--', alpha=0.5)
        axes[1, 0].grid(True, alpha=0.3)
        
        axes[1, 1].plot(time, trajectory[:, 2] * 180 / np.pi, 'm-')
        axes[1, 1].set_xlabel('Time (s)')
        axes[1, 1].set_ylabel('Heading Angle (deg)')
        axes[1, 1].set_title('Vehicle Heading')
        axes[1, 1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=300)
        plt.show()

    def plot_rewards(self, rewards, save_path=None):
        fig, ax = plt.subplots(figsize=(10, 5))
        
        ax.plot(rewards, 'b-', linewidth=1)
        ax.plot(np.cumsum(rewards) / np.arange(1, len(rewards) + 1), 
                'r-', linewidth=2, label='Moving Average')
        
        ax.set_xlabel('Step', fontsize=12)
        ax.set_ylabel('Reward', fontsize=12)
        ax.set_title('Reward Curve', fontsize=14)
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=300)
        plt.show()

    def animate_trajectory(self, ego_x, ego_y, lead_x, lead_y=None, 
                           interval=50, save_path=None):
        if lead_y is None:
            lead_y = np.zeros_like(lead_x)
        
        fig, ax = plt.subplots(figsize=(12, 6))
        
        ax.axhline(y=0, color='gray', linestyle='--', alpha=0.5)
        ax.axhline(y=3.5, color='gray', linestyle='--', alpha=0.5)
        ax.axhline(y=7.0, color='gray', linestyle='--', alpha=0.5)
        
        lane1 = Rectangle((0, -1.75), max(max(ego_x), max(lead_x)) + 50, 
                          3.5, facecolor='lightgray', alpha=0.3)
        lane2 = Rectangle((0, 1.75), max(max(ego_x), max(lead_x)) + 50, 
                          3.5, facecolor='darkgray', alpha=0.3)
        ax.add_patch(lane1)
        ax.add_patch(lane2)
        
        ego_line, = ax.plot([], [], 'b-', linewidth=2, label='Ego Path')
        lead_line, = ax.plot([], [], 'r-', linewidth=2, label='Lead Path')
        ego_car, = ax.plot([], [], 'bo', markersize=12, label='Ego Vehicle')
        lead_car, = ax.plot([], [], 'ro', markersize=12, label='Lead Vehicle')
        
        time_text = ax.text(0.02, 0.95, '', transform=ax.transAxes, 
                            fontsize=12, bbox=dict(facecolor='white', alpha=0.8))
        
        ax.set_xlabel('Position X (m)', fontsize=12)
        ax.set_ylabel('Position Y (m)', fontsize=12)
        ax.set_title('Overtaking Maneuver Animation', fontsize=14)
        ax.legend()
        ax.grid(True, alpha=0.3)
        ax.set_ylim(-2, 8)
        
        def init():
            ego_line.set_data([], [])
            lead_line.set_data([], [])
            ego_car.set_data([], [])
            lead_car.set_data([], [])
            time_text.set_text('')
            return ego_line, lead_line, ego_car, lead_car, time_text
        
        def update(frame):
            ego_line.set_data(ego_x[:frame+1], ego_y[:frame+1])
            lead_line.set_data(lead_x[:frame+1], lead_y[:frame+1])
            ego_car.set_data([ego_x[frame]], [ego_y[frame]])
            lead_car.set_data([lead_x[frame]], [lead_y[frame]])
            
            current_x = max(ego_x[frame], lead_x[frame])
            ax.set_xlim(current_x - 50, current_x + 50)
            
            time_text.set_text(f'Time: {frame * 0.01:.2f} s')
            return ego_line, lead_line, ego_car, lead_car, time_text
        
        anim = FuncAnimation(fig, update, frames=len(ego_x),
                             init_func=init, interval=interval, blit=True)
        
        if save_path:
            anim.save(save_path, writer='ffmpeg', fps=30)
        
        plt.show()
        return anim

    def plot_parallel_trajectories(self, trajectories, save_path=None):
        fig, ax = plt.subplots(figsize=(12, 6))
        
        ax.axhline(y=0, color='gray', linestyle='--', alpha=0.5)
        ax.axhline(y=3.5, color='gray', linestyle='--', alpha=0.5)
        ax.axhline(y=7.0, color='gray', linestyle='--', alpha=0.5)
        
        colors = plt.cm.viridis(np.linspace(0, 1, len(trajectories)))
        
        for i, traj in enumerate(trajectories):
            ax.plot(traj[:, 0], traj[:, 4], color=colors[i], 
                    alpha=0.6, linewidth=1.5)
            ax.scatter(traj[-1, 0], traj[-1, 4], color=colors[i], s=50)
        
        ax.set_xlabel('Position X (m)', fontsize=12)
        ax.set_ylabel('Position Y (m)', fontsize=12)
        ax.set_title(f'Parallel Environments - {len(trajectories)} Trajectories', fontsize=14)
        ax.grid(True, alpha=0.3)
        ax.set_ylim(-1, 8)
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=300)
        plt.show()
