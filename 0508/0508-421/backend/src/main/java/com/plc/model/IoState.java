package com.plc.model;

public class IoState {

    private boolean[] inputs;
    private boolean[] outputs;
    private boolean[] relays;

    public IoState() {
        this.inputs = new boolean[8];
        this.outputs = new boolean[8];
        this.relays = new boolean[16];
    }

    public IoState(boolean[] inputs, boolean[] outputs, boolean[] relays) {
        this.inputs = inputs;
        this.outputs = outputs;
        this.relays = relays;
    }

    public boolean[] getInputs() {
        return inputs;
    }

    public void setInputs(boolean[] inputs) {
        this.inputs = inputs;
    }

    public boolean[] getOutputs() {
        return outputs;
    }

    public void setOutputs(boolean[] outputs) {
        this.outputs = outputs;
    }

    public boolean[] getRelays() {
        return relays;
    }

    public void setRelays(boolean[] relays) {
        this.relays = relays;
    }
}
