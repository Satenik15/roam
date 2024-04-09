import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { Observable, Subject } from "rxjs";
import { ITask, ITaskBoard, ITaskList } from "../interfaces";

@Injectable({
    providedIn: 'root'
})
export class TasksService {
    private apiUrl = environment.apiUrl;
    public taskEditModeOpened: Subject<boolean> = new Subject();

    constructor(private http: HttpClient) {
    }

    changeTaskEditModeState(state: boolean) {
        return this.taskEditModeOpened.next(state);
    }

    public getTasks(): Observable<ITaskList> {
        return this.http.get<ITaskList>(`${this.apiUrl}/tasks`, { withCredentials: true })
    }

    public createTask(task: Partial<ITask>) {
        return this.http.post(`${this.apiUrl}/tasks`, task, { withCredentials: true })
    }

    public createTaskBoard(board: Partial<ITaskBoard>) {
        return this.http.post(`${this.apiUrl}/task-boards`, board, { withCredentials: true })
    }

    public editTask(id: string, task: Partial<ITask>) {
        return this.http.patch(`${this.apiUrl}/tasks/${id}`, task, { withCredentials: true })
    }

    public editTaskBoard(id: string, board: Partial<ITaskBoard>) {
        return this.http.patch(`${this.apiUrl}/task-boards/${id}`, board)
    }

    public deleteTask(id: string) {
        return this.http.delete(`${this.apiUrl}/tasks/${id}`, { withCredentials: true })
    }

    public deleteTaskBoard(id: string) {
        return this.http.delete(`${this.apiUrl}/task-boards/${id}`, { withCredentials: true })
    }

}