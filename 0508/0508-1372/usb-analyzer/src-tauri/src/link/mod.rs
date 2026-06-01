pub mod signal;
pub mod status;

pub use signal::{EyeDiagramEstimate, SignalIntegrity, SignalQualityGrade};
pub use status::{LinkState, LinkStatus, LinkTrainingStatus, PowerManagementState};
