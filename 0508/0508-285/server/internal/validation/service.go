package validation

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"config-center/internal/model"
	"config-center/internal/storage"
	clientv3 "go.etcd.io/etcd/client/v3"
	lua "github.com/yuin/gopher-lua"
	"gopkg.in/yaml.v3"
)

const (
	ValidationScriptPrefix = "/validation_scripts/"
	DefaultTimeout         = 5 * time.Second
	MaxScriptSize          = 64 * 1024 // 64KB
)

type ValidationResult struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
	Errors  []string `json:"errors"`
	Warnings []string `json:"warnings"`
}

type ValidationScript struct {
	ID          string    `json:"id"`
	AppID       string    `json:"app_id"`
	Namespace   string    `json:"namespace"`
	Key         string    `json:"key"`
	Script      string    `json:"script"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	IsEnabled   bool      `json:"is_enabled"`
}

type ValidationService struct {
	storage *storage.EtcdStorage
}

func NewValidationService(storage *storage.EtcdStorage) *ValidationService {
	return &ValidationService{storage: storage}
}

func (s *ValidationService) ValidateSyntax(value string, format model.ConfigFormat) *ValidationResult {
	result := &ValidationResult{Valid: true}

	switch format {
	case model.FormatYAML:
		return s.validateYAML(value)
	case model.FormatJSON:
		return s.validateJSON(value)
	case model.FormatProperties:
		return s.validateProperties(value)
	default:
		result.Valid = false
		result.Errors = append(result.Errors, fmt.Sprintf("unsupported format: %s", format))
		return result
	}
}

func (s *ValidationService) validateYAML(value string) *ValidationResult {
	result := &ValidationResult{Valid: true}

	var data interface{}
	err := yaml.Unmarshal([]byte(value), &data)
	if err != nil {
		result.Valid = false
		result.Errors = append(result.Errors, fmt.Sprintf("YAML syntax error: %v", err))
		result.Message = "YAML 语法错误"
		return result
	}

	result.Warnings = append(result.Warnings, "YAML 语法检查通过")
	return result
}

func (s *ValidationService) validateJSON(value string) *ValidationResult {
	result := &ValidationResult{Valid: true}

	var data interface{}
	err := json.Unmarshal([]byte(value), &data)
	if err != nil {
		result.Valid = false
		result.Errors = append(result.Errors, fmt.Sprintf("JSON syntax error: %v", err))
		result.Message = "JSON 语法错误"
		return result
	}

	result.Warnings = append(result.Warnings, "JSON 语法检查通过")
	return result
}

func (s *ValidationService) validateProperties(value string) *ValidationResult {
	result := &ValidationResult{Valid: true}

	lines := strings.Split(value, "\n")
	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "!") {
			continue
		}

		if !strings.Contains(line, "=") && !strings.Contains(line, ":") {
			result.Valid = false
			result.Errors = append(result.Errors, fmt.Sprintf("line %d: missing '=' or ':' separator", i+1))
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			if key == "" {
				result.Valid = false
				result.Errors = append(result.Errors, fmt.Sprintf("line %d: empty key", i+1))
			}
		}
	}

	if result.Valid {
		result.Warnings = append(result.Warnings, "Properties 语法检查通过")
	} else {
		result.Message = "Properties 语法错误"
	}

	return result
}

func (s *ValidationService) RunLuaScript(ctx context.Context, script string, configValue string, format model.ConfigFormat) (*ValidationResult, error) {
	result := &ValidationResult{Valid: true}

	if len(script) > MaxScriptSize {
		result.Valid = false
		result.Errors = append(result.Errors, "script too large (max 64KB)")
		return result, nil
	}

	L := lua.NewState()
	defer L.Close()

	ctx, cancel := context.WithTimeout(ctx, DefaultTimeout)
	defer cancel()

	done := make(chan bool, 1)
	go func() {
		select {
		case <-ctx.Done():
			L.Close()
		case <-done:
		}
	}()

	var parsedValue interface{}
	switch format {
	case model.FormatYAML:
		yaml.Unmarshal([]byte(configValue), &parsedValue)
	case model.FormatJSON:
		json.Unmarshal([]byte(configValue), &parsedValue)
	}

	L.SetGlobal("config", s.goToLuaValue(L, parsedValue))
	L.SetGlobal("config_raw", lua.LString(configValue))
	L.SetGlobal("format", lua.LString(format))

	validationFunc := `
		function validate_error(msg)
			return {valid = false, errors = {msg}, warnings = {}}
		end
		function validate_warn(msg)
			return {valid = true, errors = {}, warnings = {msg}}
		end
		function validate_ok()
			return {valid = true, errors = {}, warnings = {}}
		end
		function assert_not_nil(value, msg)
			if value == nil then
				error(msg or "value is nil")
			end
		end
		function assert_type(value, expected_type, msg)
			if type(value) ~= expected_type then
				error(msg or ("expected " .. expected_type .. ", got " .. type(value)))
			end
		end
	`

	if err := L.DoString(validationFunc); err != nil {
		result.Valid = false
		result.Errors = append(result.Errors, fmt.Sprintf("failed to load builtin functions: %v", err))
		done <- true
		return result, nil
	}

	if err := L.DoString(script); err != nil {
		result.Valid = false
		result.Errors = append(result.Errors, fmt.Sprintf("script execution error: %v", err))
		result.Message = "Lua 脚本执行失败"
		done <- true
		return result, nil
	}

	validateFunc := L.GetGlobal("validate")
	if validateFunc.Type() == lua.LTNil {
		result.Valid = false
		result.Errors = append(result.Errors, "script must define a 'validate' function")
		done <- true
		return result, nil
	}

	if err := L.CallByParam(lua.P{
		Fn:      validateFunc,
		NRet:    1,
		Protect: true,
	}); err != nil {
		result.Valid = false
		result.Errors = append(result.Errors, fmt.Sprintf("validate function error: %v", err))
		done <- true
		return result, nil
	}

	ret := L.Get(-1)
	L.Pop(1)

	if tbl, ok := ret.(*lua.LTable); ok {
		valid := tbl.RawGetString("valid")
		if b, ok := valid.(lua.LBool); ok {
			result.Valid = bool(b)
		}

		errors := tbl.RawGetString("errors")
		if errTbl, ok := errors.(*lua.LTable); ok {
			errTbl.ForEach(func(k, v lua.LValue) {
				if str, ok := v.(lua.LString); ok {
					result.Errors = append(result.Errors, string(str))
				}
			})
		}

		warnings := tbl.RawGetString("warnings")
		if warnTbl, ok := warnings.(*lua.LTable); ok {
			warnTbl.ForEach(func(k, v lua.LValue) {
				if str, ok := v.(lua.LString); ok {
					result.Warnings = append(result.Warnings, string(str))
				}
			})
		}

		msg := tbl.RawGetString("message")
		if str, ok := msg.(lua.LString); ok {
			result.Message = string(str)
		}
	}

	done <- true
	return result, nil
}

func (s *ValidationService) goToLuaValue(L *lua.LState, value interface{}) lua.LValue {
	switch v := value.(type) {
	case nil:
		return lua.LNil
	case bool:
		return lua.LBool(v)
	case string:
		return lua.LString(v)
	case int:
		return lua.LNumber(v)
	case int64:
		return lua.LNumber(v)
	case float64:
		return lua.LNumber(v)
	case map[string]interface{}:
		tbl := L.NewTable()
		for key, val := range v {
			tbl.RawSetString(key, s.goToLuaValue(L, val))
		}
		return tbl
	case map[interface{}]interface{}:
		tbl := L.NewTable()
		for key, val := range v {
			tbl.RawSetString(fmt.Sprintf("%v", key), s.goToLuaValue(L, val))
		}
		return tbl
	case []interface{}:
		tbl := L.NewTable()
		for i, val := range v {
			tbl.RawSetInt(i+1, s.goToLuaValue(L, val))
		}
		return tbl
	default:
		return lua.LString(fmt.Sprintf("%v", v))
	}
}

func (s *ValidationService) ValidateConfig(ctx context.Context, appID, namespace, key, value string, format model.ConfigFormat) (*ValidationResult, error) {
	syntaxResult := s.ValidateSyntax(value, format)
	if !syntaxResult.Valid {
		return syntaxResult, nil
	}

	script, err := s.GetScript(ctx, appID, namespace, key)
	if err != nil {
		return nil, err
	}

	if script != nil && script.IsEnabled && script.Script != "" {
		luaResult, err := s.RunLuaScript(ctx, script.Script, value, format)
		if err != nil {
			return nil, err
		}

		syntaxResult.Valid = syntaxResult.Valid && luaResult.Valid
		syntaxResult.Errors = append(syntaxResult.Errors, luaResult.Errors...)
		syntaxResult.Warnings = append(syntaxResult.Warnings, luaResult.Warnings...)
		if luaResult.Message != "" {
			syntaxResult.Message = luaResult.Message
		}
	}

	if syntaxResult.Valid {
		syntaxResult.Message = "配置验证通过"
	}

	return syntaxResult, nil
}

func (s *ValidationService) SaveScript(ctx context.Context, script *ValidationScript) error {
	key := fmt.Sprintf("%s%s/%s/%s", ValidationScriptPrefix, script.AppID, script.Namespace, script.Key)

	existing, _ := s.GetScript(ctx, script.AppID, script.Namespace, script.Key)
	if existing != nil {
		script.CreatedAt = existing.CreatedAt
	} else {
		script.CreatedAt = time.Now()
	}
	script.UpdatedAt = time.Now()

	data, err := json.Marshal(script)
	if err != nil {
		return err
	}

	_, err = s.storage.Put(ctx, key, string(data))
	return err
}

func (s *ValidationService) GetScript(ctx context.Context, appID, namespace, key string) (*ValidationScript, error) {
	keyPath := fmt.Sprintf("%s%s/%s/%s", ValidationScriptPrefix, appID, namespace, key)
	resp, err := s.storage.Get(ctx, keyPath)
	if err != nil {
		return nil, err
	}
	if len(resp.Kvs) == 0 {
		return nil, nil
	}

	var script ValidationScript
	err = json.Unmarshal(resp.Kvs[0].Value, &script)
	return &script, err
}

func (s *ValidationService) DeleteScript(ctx context.Context, appID, namespace, key string) error {
	keyPath := fmt.Sprintf("%s%s/%s/%s", ValidationScriptPrefix, appID, namespace, key)
	_, err := s.storage.Delete(ctx, keyPath)
	return err
}

func (s *ValidationService) GetScriptsByApp(ctx context.Context, appID, namespace string) ([]*ValidationScript, error) {
	prefix := fmt.Sprintf("%s%s/%s/", ValidationScriptPrefix, appID, namespace)
	resp, err := s.storage.Get(ctx, prefix, clientv3.WithPrefix())
	if err != nil {
		return nil, err
	}

	scripts := make([]*ValidationScript, 0, len(resp.Kvs))
	for _, kv := range resp.Kvs {
		var script ValidationScript
		if err := json.Unmarshal(kv.Value, &script); err == nil {
			scripts = append(scripts, &script)
		}
	}
	return scripts, nil
}
