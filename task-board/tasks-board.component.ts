import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ITaskBoard, ITaskInfo, ITaskList } from '@app/shared/interfaces';
import { TasksService } from '@app/shared/services/tasks.service';

@Component({
  selector: 'app-tasks-board',
  templateUrl: './tasks-board.component.html',
  styleUrls: ['./tasks-board.component.scss'],
})
export class TasksBoardComponent implements OnInit {
  @ViewChild('sidenav') sidenav: any;
  @Output() sidebarOpenedEmmiter: EventEmitter<boolean> = new EventEmitter();

  isData: boolean = false;
  isAddTaskListOpen: boolean = false;
  sidebarOpened: any;
  tasks: ITaskBoard[] = [];
  selectedTask!: ITaskInfo;
  groupedTasks: { [key: number]: any } = {};
  events: string[] = [];
  search: string = '';

  detailDrawerPosition = 'end' as any;

  get isMobile() {
    return this.deviceService.isMobile();
  }

  constructor(
    private tasksService: TasksService,
    private deviceService: DeviceDetectorService
  ) { }

  ngOnInit() {
    this.getTasks();

    if (this.isMobile) this.detailDrawerPosition = 'start';
  }

  onSidebarOpen(event: any) {
    this.sidenav.toggle();
    this.sidebarOpened = event.sidebarState;
    this.selectedTask = event.selectedTask;
    this.sidebarOpenedEmmiter.emit(event);
  }

  getTasks() {
    this.isAddTaskListOpen = false;
    this.tasksService.getTasks().subscribe((data: ITaskList) => {
      this.isData = true;
      this.tasks = data.taskBoards;
      return this.tasks;
    });
  }

  drop(event: CdkDragDrop<any[]>, state: any) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    if (event.previousIndex === event.currentIndex && event.container.id === event.previousContainer.id) {
      return
    }

    let droppedItem = event.container.data[event.currentIndex];

    let task = {
      order: event.currentIndex,
      taskBoardId: state.id,
      name: droppedItem.name
    }
    this.tasksService.editTask(droppedItem.id, task).subscribe();
  }

  dropList(event: CdkDragDrop<any[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(
        this.tasks,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  onAddTaskList(taskListName: string) {
    let slugName = taskListName.toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    let board: Partial<ITaskBoard> = {
      code: slugName,
      name: taskListName,
      order: this.tasks.length,
      status: 1
    }
    this.tasksService.createTaskBoard(board)
      .subscribe(_ => this.getTasks());
  }
}
