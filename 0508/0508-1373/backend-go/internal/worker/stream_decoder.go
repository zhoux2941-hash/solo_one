package worker

import (
	"bufio"
	"encoding/json"
	"io"
	"strings"
)

type StreamChunk struct {
	Content string
	Done    bool
}

type StreamDecoder struct {
	reader *bufio.Reader
}

func NewStreamDecoder(r io.Reader) *StreamDecoder {
	return &StreamDecoder{
		reader: bufio.NewReader(r),
	}
}

func (d *StreamDecoder) Decode() (*StreamChunk, error) {
	for {
		line, err := d.reader.ReadString('\n')
		if err != nil {
			if err == io.EOF && strings.HasPrefix(strings.TrimSpace(line), "data:") {
			} else {
				return nil, err
			}
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if !strings.HasPrefix(line, "data:") {
			continue
		}

		data := strings.TrimPrefix(line, "data:")
		data = strings.TrimSpace(data)

		if data == "[DONE]" {
			return &StreamChunk{Done: true}, io.EOF
		}

		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
				FinishReason *string `json:"finish_reason"`
			} `json:"choices"`
		}

		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			continue
		}

		content := ""
		done := false

		if len(chunk.Choices) > 0 {
			content = chunk.Choices[0].Delta.Content
			if chunk.Choices[0].FinishReason != nil {
				done = true
			}
		}

		return &StreamChunk{
			Content: content,
			Done:    done,
		}, nil
	}
}

func (c *StreamChunk) HasContent() bool {
	return c.Content != ""
}
