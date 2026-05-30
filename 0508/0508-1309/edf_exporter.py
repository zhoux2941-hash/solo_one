import numpy as np
import pyedflib
import os
from datetime import datetime

def export_edf(eeg_data, mode='normal', filepath=None):
    if filepath is None:
        filepath = f'eeg_{mode}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.edf'
    n_channels = eeg_data.shape[0]
    channel_names = ['Fp1', 'Fp2', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2']
    f = pyedflib.EdfWriter(filepath, n_channels, file_type=pyedflib.FILETYPE_EDFPLUS)
    channel_info = []
    data_list = []
    for i in range(n_channels):
        ch_dict = {
            'label': channel_names[i] if i < len(channel_names) else f'EEG {i+1}',
            'dimension': 'uV',
            'sample_rate': 256,
            'physical_min': -500,
            'physical_max': 500,
            'digital_min': -32768,
            'digital_max': 32767,
            'transducer': '',
            'prefilter': ''
        }
        channel_info.append(ch_dict)
        data_list.append(eeg_data[i].astype(np.float64))
    f.setSignalHeaders(channel_info)
    f.setStartdatetime(datetime.now())
    f.setPatientName('EEG_Simulation')
    f.setPatientCode('001')
    f.writeSamples(data_list)
    f.close()
    return filepath
