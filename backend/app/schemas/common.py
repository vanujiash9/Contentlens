from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

DataT = TypeVar("DataT")


class ApiError(BaseModel):
    code: str
    message: str


class ApiResponse(BaseModel, Generic[DataT]):
    model_config = ConfigDict(populate_by_name=True)

    data: DataT | None = None
    error: ApiError | None = None
