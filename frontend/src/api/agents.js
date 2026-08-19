import client from "./client";

export const runAgent = (task, inputData = {}) =>
  client.post("/agents/run", { task, input_data: inputData });
