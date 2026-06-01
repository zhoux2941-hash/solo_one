use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LinkState {
    U0,
    U1,
    U2,
    U3,
}

impl fmt::Display for LinkState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LinkState::U0 => write!(f, "U0 (Active)"),
            LinkState::U1 => write!(f, "U1 (Standby/Fast Exit)"),
            LinkState::U2 => write!(f, "U2 (Standby/Slow Exit)"),
            LinkState::U3 => write!(f, "U3 (Suspended)"),
        }
    }
}

impl LinkState {
    pub fn is_active(&self) -> bool {
        matches!(self, LinkState::U0)
    }

    pub fn exit_latency_us(&self) -> u64 {
        match self {
            LinkState::U0 => 0,
            LinkState::U1 => 1,
            LinkState::U2 => 60,
            LinkState::U3 => 3000,
        }
    }

    pub fn power_mw(&self) -> f64 {
        match self {
            LinkState::U0 => 500.0,
            LinkState::U1 => 50.0,
            LinkState::U2 => 5.0,
            LinkState::U3 => 0.5,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LinkTrainingStatus {
    NotTrained,
    Training,
    Trained,
    Error,
}

impl fmt::Display for LinkTrainingStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LinkTrainingStatus::NotTrained => write!(f, "Not Trained"),
            LinkTrainingStatus::Training => write!(f, "Training"),
            LinkTrainingStatus::Trained => write!(f, "Trained"),
            LinkTrainingStatus::Error => write!(f, "Error"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerManagementState {
    pub current_state: LinkState,
    pub u1_enabled: bool,
    pub u2_enabled: bool,
    pub u1_timeout_us: Option<u64>,
    pub u2_timeout_us: Option<u64>,
    pub inactivity_timer_ms: Option<u64>,
    pub remote_wakeup_capable: bool,
}

impl Default for PowerManagementState {
    fn default() -> Self {
        PowerManagementState {
            current_state: LinkState::U0,
            u1_enabled: true,
            u2_enabled: true,
            u1_timeout_us: Some(128),
            u2_timeout_us: Some(2048),
            inactivity_timer_ms: Some(100),
            remote_wakeup_capable: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkStatus {
    pub state: LinkState,
    pub training_status: LinkTrainingStatus,
    pub power_state: PowerManagementState,
    pub last_updated: DateTime<Utc>,
    pub transition_count: u64,
    pub error_count: u64,
    pub uptime_seconds: f64,
}

impl Default for LinkStatus {
    fn default() -> Self {
        LinkStatus {
            state: LinkState::U0,
            training_status: LinkTrainingStatus::NotTrained,
            power_state: PowerManagementState::default(),
            last_updated: Utc::now(),
            transition_count: 0,
            error_count: 0,
            uptime_seconds: 0.0,
        }
    }
}

impl LinkStatus {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn transition_to(&mut self, new_state: LinkState) {
        if self.state != new_state {
            self.state = new_state;
            self.power_state.current_state = new_state;
            self.transition_count += 1;
            self.last_updated = Utc::now();
        }
    }

    pub fn set_training_status(&mut self, status: LinkTrainingStatus) {
        self.training_status = status;
        self.last_updated = Utc::now();
    }

    pub fn record_error(&mut self) {
        self.error_count += 1;
        self.last_updated = Utc::now();
    }

    pub fn update_uptime(&mut self, seconds: f64) {
        self.uptime_seconds = seconds;
        self.last_updated = Utc::now();
    }
}
