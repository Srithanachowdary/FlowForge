import OpenAI from "openai";
import Task from "../models/Task.model.js";
import Sprint from "../models/Sprint.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-proj-mock_openai_key_here" || apiKey.includes("mock")) {
    return null;
  }
  return new OpenAI({ apiKey });
};

// 1. Suggest a sprint plan from backlog tasks
export const suggestSprint = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      throw new ApiError(400, "projectId is required");
    }

    const backlogTasks = await Task.find({ projectId, sprintId: null });
    if (backlogTasks.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, { sprintGoal: "Add tasks to backlog first", suggestedTasks: [] }, "No tasks in backlog")
      );
    }

    const openai = getOpenAIClient();

    if (!openai) {
      // Mock Fallback
      const suggestedTasks = backlogTasks.slice(0, 3).map((t) => t._id);
      const sprintGoal = "Core initialization sprint focusing on the top " + suggestedTasks.length + " items in backlog.";
      return res.status(200).json(
        new ApiResponse(200, { sprintGoal, suggestedTasks }, "Mock Sprint suggestion generated successfully")
      );
    }

    const taskListText = backlogTasks.map((t) => `- [ID: ${t._id}] ${t.title} (${t.storyPoints} pts) priority: ${t.priority}`).join("\n");

    const prompt = `You are an expert Scrum Master.
Given the following backlog tasks in a project:
${taskListText}

Recommend a sprint goal and select the top tasks (by ID) to include in a 2-week sprint.
Return ONLY a valid JSON object matching this structure:
{
  "sprintGoal": "Your sprint goal text",
  "suggestedTasks": ["taskId1", "taskId2"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const parsedResult = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(new ApiResponse(200, parsedResult, "Sprint plan suggested successfully"));
  } catch (error) {
    next(error);
  }
};

// 2. Generate subtasks checklist for a task
export const generateSubtasks = async (req, res, next) => {
  try {
    const { taskId } = req.body;
    if (!taskId) {
      throw new ApiError(400, "taskId is required");
    }

    const task = await Task.findById(taskId);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const openai = getOpenAIClient();

    if (!openai) {
      // Mock Fallback
      let items = ["Define requirements & architecture", "Implement REST API controller layer", "Add Socket notification signals", "Run automated testing scripts"];
      if (task.title.toLowerCase().includes("auth") || task.title.toLowerCase().includes("login")) {
        items = ["Configure mongoose User schema", "Implement register/login endpoints", "Write verifyToken auth middleware", "Integrate JWT refresh rotation cookies"];
      } else if (task.title.toLowerCase().includes("stripe") || task.title.toLowerCase().includes("billing")) {
        items = ["Initialize Stripe developer products", "Build checkout session generator", "Implement raw webhooks listener controller", "Display plan limit gauges in settings"];
      }

      return res.status(200).json(
        new ApiResponse(200, items, "Mock Subtasks checklist generated successfully")
      );
    }

    const prompt = `Generate a JSON array of 3 to 5 clear, actionable subtask titles to complete this task:
Title: ${task.title}
Description: ${task.description || "No description provided."}

Return ONLY a JSON array, for example: ["Step 1", "Step 2", "Step 3"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    const subtaskArray = Array.isArray(result) ? result : Object.values(result)[0] || [];
    return res.status(200).json(new ApiResponse(200, subtaskArray, "Subtasks generated successfully"));
  } catch (error) {
    next(error);
  }
};

// 3. Predict delay risks based on velocity
export const predictDelay = async (req, res, next) => {
  try {
    const { sprintId } = req.body;
    if (!sprintId) {
      throw new ApiError(400, "sprintId is required");
    }

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw new ApiError(404, "Sprint not found");
    }

    const sprintTasks = await Task.find({ sprintId });
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const incompletePoints = sprintTasks.filter(t => t.status !== "done").reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const openai = getOpenAIClient();

    if (!openai) {
      // Mock Fallback
      const risk = incompletePoints > 10 ? "high" : incompletePoints > 5 ? "medium" : "low";
      const reasoning = `Based on a simulated sprint velocity, the remaining ${incompletePoints} story points (out of ${totalPoints} total) present a ${risk} delay risk. We estimate a potential completion lag of ${Math.round(incompletePoints / 3)} days.`;
      
      return res.status(200).json(
        new ApiResponse(200, { risk, reasoning }, "Mock Delay prediction generated successfully")
      );
    }

    const prompt = `Analyze the delay risk for this sprint:
Sprint Name: ${sprint.name}
Sprint Goal: ${sprint.goal}
Total points in Sprint: ${totalPoints}
Incomplete points remaining: ${incompletePoints}

Predict the delay risk level ("low", "medium", "high") and provide a 2-sentence Scrum reasoning/advice.
Return ONLY a valid JSON object matching this structure:
{
  "risk": "medium",
  "reasoning": "Your advice text here."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const parsedResult = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(new ApiResponse(200, parsedResult, "Delay risk predicted successfully"));
  } catch (error) {
    next(error);
  }
};

// 4. Summarize completed sprint details
export const summarizeSprint = async (req, res, next) => {
  try {
    const { sprintId } = req.body;
    if (!sprintId) {
      throw new ApiError(400, "sprintId is required");
    }

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw new ApiError(404, "Sprint not found");
    }

    const sprintTasks = await Task.find({ sprintId });
    const completed = sprintTasks.filter(t => t.status === "done");
    const incomplete = sprintTasks.filter(t => t.status !== "done");

    const openai = getOpenAIClient();

    if (!openai) {
      // Mock Fallback
      const summary = `Sprint "${sprint.name}" finished with a total velocity of ${sprint.velocity} story points. We successfully completed ${completed.length} tasks (including: ${completed.slice(0, 2).map(t => t.title).join(", ")}). ${incomplete.length} tasks were incomplete and triaged back to backlog.`;
      
      return res.status(200).json(
        new ApiResponse(200, { summary }, "Mock Sprint summary generated successfully")
      );
    }

    const completedText = completed.map(t => `- ${t.title} (${t.storyPoints} pts)`).join("\n");
    const incompleteText = incomplete.map(t => `- ${t.title} (${t.storyPoints} pts)`).join("\n");

    const prompt = `Summarize the achievements and outcomes of this completed sprint:
Sprint Name: ${sprint.name}
Goal: ${sprint.goal}

Completed Tasks:
${completedText || "None"}

Incomplete Tasks (returned to backlog):
${incompleteText || "None"}

Write a 3-sentence, professional sprint wrap-up summary for stakeholder emails.
Return ONLY a valid JSON object matching this structure:
{
  "summary": "Your wrap-up text"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const parsedResult = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(new ApiResponse(200, parsedResult, "Sprint wrap-up summary generated successfully"));
  } catch (error) {
    next(error);
  }
};
