from dataclasses import dataclass, field
from typing import Any, Protocol
from uuid import UUID


@dataclass(frozen=True)
class WorkflowContext:
    run_id: UUID
    workspace_id: UUID
    input: dict[str, Any]
    state: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class WorkflowResult:
    step_outputs: dict[str, Any]


class WorkflowStep(Protocol):
    name: str

    def execute(self, context: WorkflowContext) -> Any:
        ...


class WorkflowError(Exception):
    def __init__(self, step_name: str, cause: Exception) -> None:
        self.step_name = step_name
        self.cause = cause
        super().__init__(f"Workflow step '{step_name}' failed")


class WorkflowRunner:
    def __init__(self, steps: list[WorkflowStep]) -> None:
        self.steps = tuple(steps)

    def run(self, context: WorkflowContext) -> WorkflowResult:
        outputs: dict[str, Any] = {}
        for step in self.steps:
            try:
                outputs[step.name] = step.execute(context)
            except Exception as exc:
                raise WorkflowError(step.name, exc) from exc

        return WorkflowResult(step_outputs=outputs)
