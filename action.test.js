import { afterEach, expect, test, vi } from "vitest"

import { action } from "./action"

const api = {
  info: vi.fn(),
  error: vi.fn(),
  getInput: vi.fn(),
  setFailed: vi.fn(),
}

afterEach(() => {
  api.info.mockReset()
  api.error.mockReset()
  api.getInput.mockReset()
  api.setFailed.mockReset()
})

test("parses PR labels", () => {
  const labels = [{ name: "foo" }, { name: "bar" }]
  action({ labels }, api)
  expect(api.info).toHaveBeenCalledWith("Found PR labels: foo, bar")
})

test("parses rules", () => {
  const config = {
    "all-of": "foo, bar",
    "one-of": "baz",
    "none-of": "qux, quux",
  }
  api.getInput.mockImplementation((key) => config[key])

  action({}, api)

  expect(api.info).toHaveBeenCalledWith("Checking label rules:")
  expect(api.info).toHaveBeenCalledWith("  all of: foo, bar")
  expect(api.info).toHaveBeenCalledWith("  one of: baz")
  expect(api.info).toHaveBeenCalledWith("  none of: qux, quux")
})

test("fails if no rules are defined", () => {
  const config = {
    "all-of": "",
    "one-of": "",
    "none-of": "",
  }
  api.getInput.mockImplementation((key) => config[key])

  action({}, api)

  expect(api.setFailed).toHaveBeenCalledWith("No rules defined")
})

test("fails if all-of rule is not satisfied", () => {
  const config = {
    "all-of": "foo, bar",
    "one-of": "",
    "none-of": "",
  }
  api.getInput.mockImplementation((key) => config[key])

  action({ labels: [{ name: "foo" }] }, api)

  expect(api.error).toHaveBeenCalledWith("Missing required labels: bar")
  expect(api.setFailed).toHaveBeenCalledWith("PR labels do not meet requirements")
})

test("fails if one-of rule is not satisfied (no matches)", () => {
  const config = {
    "all-of": "",
    "one-of": "foo, bar",
    "none-of": "",
  }
  api.getInput.mockImplementation((key) => config[key])

  action({ labels: [] }, api)

  expect(api.error).toHaveBeenCalledWith("Exactly one of these labels is required: foo, bar")
  expect(api.setFailed).toHaveBeenCalledWith("PR labels do not meet requirements")
})

test("fails if one-of rule is not satisfied (too many matches)", () => {
  const config = {
    "all-of": "",
    "one-of": "foo, bar",
    "none-of": "",
  }
  api.getInput.mockImplementation((key) => config[key])

  action({ labels: [{ name: "foo" }, { name: "bar" }] }, api)

  expect(api.error).toHaveBeenCalledWith("At most one of these labels may be present: foo, bar")
  expect(api.setFailed).toHaveBeenCalledWith("PR labels do not meet requirements")
})

test("fails if none-of rule is not satisfied", () => {
  const config = {
    "all-of": "",
    "one-of": "",
    "none-of": "foo, bar",
  }
  api.getInput.mockImplementation((key) => config[key])

  action({ labels: [{ name: "foo" }] }, api)

  expect(api.error).toHaveBeenCalledWith("Found disallowed labels: foo")
  expect(api.setFailed).toHaveBeenCalledWith("PR labels do not meet requirements")
})

test("passes if all rules are satisfied", () => {
  const config = {
    "all-of": "foo",
    "one-of": "bar",
    "none-of": "baz",
  }
  api.getInput.mockImplementation((key) => config[key])

  action({ labels: [{ name: "foo" }, { name: "bar" }] }, api)

  expect(api.error).not.toHaveBeenCalled()
  expect(api.setFailed).not.toHaveBeenCalled()
})
