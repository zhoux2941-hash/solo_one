import numpy as np
import multiprocessing as mp
from functools import partial


def _worker(env_creator, conn):
    env = env_creator()
    while True:
        cmd, data = conn.recv()
        if cmd == 'reset':
            obs = env.reset(data)
            conn.send(obs)
        elif cmd == 'step':
            obs, reward, done, info = env.step(data)
            conn.send((obs, reward, done, info))
        elif cmd == 'render':
            env.render()
        elif cmd == 'close':
            conn.close()
            break
        elif cmd == 'get_trajectory':
            traj = env.get_trajectory()
            conn.send(traj)
        else:
            raise NotImplementedError


class ParallelEnv:
    def __init__(self, env_creator, num_envs=None):
        if num_envs is None:
            num_envs = mp.cpu_count()
        self.num_envs = num_envs
        self.env_creator = env_creator
        
        self.parents = []
        self.workers = []
        
        ctx = mp.get_context('spawn')
        for _ in range(num_envs):
            parent, child = ctx.Pipe()
            self.parents.append(parent)
            worker = ctx.Process(target=_worker, args=(env_creator, child))
            worker.daemon = True
            worker.start()
            self.workers.append(worker)

    def reset(self, initial_states=None):
        if initial_states is None:
            initial_states = [None] * self.num_envs
        
        for parent, init_state in zip(self.parents, initial_states):
            parent.send(('reset', init_state))
        
        obs_list = [parent.recv() for parent in self.parents]
        return np.array(obs_list)

    def step(self, actions):
        assert len(actions) == self.num_envs
        
        for parent, action in zip(self.parents, actions):
            parent.send(('step', action))
        
        results = [parent.recv() for parent in self.parents]
        obs_list, reward_list, done_list, info_list = zip(*results)
        
        return (
            np.array(obs_list),
            np.array(reward_list),
            np.array(done_list),
            list(info_list)
        )

    def step_async(self, actions):
        assert len(actions) == self.num_envs
        for parent, action in zip(self.parents, actions):
            parent.send(('step', action))

    def step_wait(self):
        results = [parent.recv() for parent in self.parents]
        obs_list, reward_list, done_list, info_list = zip(*results)
        return (
            np.array(obs_list),
            np.array(reward_list),
            np.array(done_list),
            list(info_list)
        )

    def get_trajectories(self):
        for parent in self.parents:
            parent.send(('get_trajectory', None))
        
        traj_list = [parent.recv() for parent in self.parents]
        return traj_list

    def close(self):
        for parent in self.parents:
            parent.send(('close', None))
        for worker in self.workers:
            worker.join()

    def __del__(self):
        try:
            self.close()
        except:
            pass
