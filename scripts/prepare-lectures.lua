-- Quarto runs this script with its bundled Pandoc; no extra runtime is needed.
local function fail(message)
  error("lectures.yml: " .. message, 0)
end

local function read_file(path)
  local file = io.open(path, "r")
  if not file then return nil end
  local text = file:read("*a")
  file:close()
  return text
end

local yaml = read_file("lectures.yml")
if not yaml then fail("cannot read the lecture catalog") end
local ok, document = pcall(pandoc.read, "---\n" .. yaml .. "\n---\n", "markdown")
if not ok then fail("invalid YAML: " .. tostring(document)) end
local lectures = document.meta.lectures
if pandoc.utils.type(lectures) ~= "List" then
  fail("'lectures' must be a list")
end

local function text_field(entry, key, location, required)
  local value = entry[key]
  if value == nil then
    if required then fail(location .. "." .. key .. " is required") end
    return nil
  end
  local kind = pandoc.utils.type(value)
  if kind ~= "Inlines" and kind ~= "string" then
    fail(location .. "." .. key .. " must be a string")
  end
  local text = pandoc.utils.stringify(value)
  if text:match("^%s*$") then
    if required then fail(location .. "." .. key .. " must not be empty") end
    return nil -- YAML null is represented as an empty metadata string.
  end
  return text
end

local function local_path(path, location)
  if path:match("^/") or path:match("^[%a][%w+.-]*:")
      or path:find("\\", 1, true) or path:find("[%c?#]") then
    fail(location .. " must be a path relative to the project root")
  end
  for segment in path:gmatch("[^/]+") do
    if segment == ".." then fail(location .. " must stay inside the project") end
  end
  return path
end

local function file_exists(path)
  local file = io.open(path, "r")
  if not file then return false end
  file:close()
  return true
end

local function directory_exists(path)
  return pcall(pandoc.system.list_directory, path)
end

local sources, resources, seen_sources, seen_resources, numbers = {}, {}, {}, {}, {}
local function append_unique(list, seen, value)
  if not seen[value] then
    list[#list + 1] = value
    seen[value] = true
  end
end

for index, lecture in ipairs(lectures) do
  local location = "lectures[" .. index .. "]"
  if pandoc.utils.type(lecture) ~= "table" then fail(location .. " must be a mapping") end
  local number_text = text_field(lecture, "number", location, true)
  local number = tonumber(number_text)
  if not number or number < 1 or number % 1 ~= 0 then
    fail(location .. ".number must be a positive integer")
  end
  if numbers[number] then fail(location .. ".number duplicates lecture " .. number_text) end
  numbers[number] = true
  text_field(lecture, "title", location, true)
  text_field(lecture, "module", location, true)

  local source = text_field(lecture, "source", location)
  if source then
    local_path(source, location .. ".source")
    if not source:match("%.qmd$") then fail(location .. ".source must be a .qmd file") end
    if not file_exists(source) then fail(location .. ".source does not exist: " .. source) end
    append_unique(sources, seen_sources, source)
    local directory = pandoc.path.directory(source)
    for _, name in ipairs({ "assets", "vendor" }) do
      local path = directory .. "/" .. name
      if directory_exists(path) then append_unique(resources, seen_resources, path .. "/**") end
    end
  end

  for _, format in ipairs({ "html", "pdf", "pptx" }) do
    local path = text_field(lecture, format, location)
    if path and not path:match("^https?://") then
      local_path(path, location .. "." .. format)
      -- HTML associated with a source is produced by this render.
      if format ~= "html" or not source then
        if not file_exists(path) then fail(location .. "." .. format .. " does not exist: " .. path) end
        append_unique(resources, seen_resources, path)
      end
    end
  end

  local resource_kind = pandoc.utils.type(lecture.resources)
  local resources_null = resource_kind == "string" and lecture.resources == ""
  if lecture.resources ~= nil and not resources_null then
    if resource_kind ~= "List" then
      fail(location .. ".resources must be a list")
    end
    for resource_index, value in ipairs(lecture.resources) do
      local label = location .. ".resources[" .. resource_index .. "]"
      local path = text_field({ path = value }, "path", label, true)
      append_unique(resources, seen_resources, local_path(path, label))
    end
  end
end

local output = { "# Generated from lectures.yml by scripts/prepare-lectures.lua. Do not edit.", "project:" }
local function write_list(key, values)
  if #values == 0 then
    output[#output + 1] = "  " .. key .. ": []"
  else
    output[#output + 1] = "  " .. key .. ":"
    for _, value in ipairs(values) do
      output[#output + 1] = '    - "' .. value:gsub('"', '\\"') .. '"'
    end
  end
end
write_list("render", sources)
write_list("resources", resources)
local generated = table.concat(output, "\n") .. "\n"
if read_file("_lecture-build.yml") ~= generated then
  local file = assert(io.open("_lecture-build.yml", "w"))
  file:write(generated)
  file:close()
end
