import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSidenav } from '@angular/material/sidenav';
import SwiperCore, { Navigation, Scrollbar, SwiperOptions } from 'swiper';

import { ApiService } from "@app/shared/services/api.service";
import { IBookingDetails, ICalendarResponse, IDay, IProperty, IReservationDetails, IRoom } from '@app/shared/interfaces';
import { EBookingReservationDay } from '@app/shared/models';
import { CalendarHeaderComponent } from '../../shared/components/calendar-header/calendar-header.component';

interface ISelectedDate {
  index?: number | null;
  roomId?: string;
}

SwiperCore.use([Navigation, Scrollbar]);

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('spanEl') spanEl!: ElementRef;

  calendarHeader = CalendarHeaderComponent;

  public selectedStartDate!: ISelectedDate;

  public elementWidthMr: string = '';
  public elementWidthMl: string = '';
  public startDay: string = '';
  public endDay: string = '';

  public numberOfDays = 15;
  public dropzoneWidth: number = 0;
  public showReservationDetails: boolean = false;
  public showQuickReservation: boolean = false;
  public dropzonIsShown: boolean = false;
  public days: IDay[] = [];
  public today = new Date();
  public currentMonth: Date = this.today;
  public properties: IProperty[] = [];
  public numberDaysCount = new Array(this.numberOfDays);
  public expandedProperties: string[] = [];
  public events: string[] = [];

  public bookingReservations: { [key: string]: EBookingReservationDay[] } = {}
  public EBookingReservationDay = EBookingReservationDay;
  public reservationDetails!: IReservationDetails;

  public date = new FormControl('');

  public config: SwiperOptions = {
    slidesPerView: this.numberOfDays,
    spaceBetween: 25,
    scrollbar: {
      draggable: true
    }
  };

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.goToToday();
  }

  ngAfterViewInit() {
    this.getElementWidth();
  }

  onSidenavOpen() {
    this.resetSelected();
  }

  @HostListener('window:resize')
  onResize() {
    this.getElementWidth();
  }

  private getElementWidth() {
    this.elementWidthMr = this.spanEl.nativeElement.offsetWidth / 2 + 22 + 'px';
    this.elementWidthMl = this.spanEl.nativeElement.offsetWidth / 2 - 17 + 'px';
  }

  private getCalendarBookings(startDay: string = '') {
    this.apiService.getCalendarBookings(this.numberOfDays + 1, startDay).subscribe((data: ICalendarResponse) => {
      this.properties = data.properties
      this.days = data.days;
      this.currentMonth = new Date(this.days[0].date);

      this.properties.map(property => {
        if(property && property.rooms) {
          property.rooms.map(room => {
            this.bookingReservations[room.id] = new Array(this.numberOfDays).fill(EBookingReservationDay.Free)
  
            room.bookingDetails.map((detail, i) => {
              if (this.getStartDay(detail) === 0 && this.getEndDay(detail) === 0) {
                return
              }
              const startDay = this.getStartDay(detail) - 1;
              const endDay = this.getEndDay(detail) - 1;
  
              if (startDay < 0) {
                for(let i = 0; i < endDay; i++) {
                  this.bookingReservations[room.id][i] = EBookingReservationDay.Reserved;
                }
              } else if(startDay > 0 && endDay < 0) {
                for(let i = startDay; i < startDay + detail.dayCount; i++) {
                  this.bookingReservations[room.id][i] = EBookingReservationDay.Reserved;
                  }
              }
               else {
                for(let i = startDay; i < endDay; i++) {
                  this.bookingReservations[room.id][i] = EBookingReservationDay.Reserved;
                  }
                }
              this.bookingReservations[room.id].length = this.numberOfDays;
            })
          })
        }
      })
      return data.properties
    })
  }

  private formatDate(date: Date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
  }

  private getPreviousDay(date = new Date()) {
    const previous = new Date(date.getTime());
    previous.setDate(date.getDate() - 2);

    return previous;
  }

  getStartDay(booking: IBookingDetails) {
    return this.days.findIndex(day => day.date === this.formatDate(new Date(booking.arrivalDateTime))) + 1;
  }

  getEndDay(booking: IBookingDetails) {
    return this.days.findIndex(day => day.date === this.formatDate(new Date(booking.departureDateTime))) + 1;
  }

  computeGanttDays(booking: IBookingDetails) {
    let start = this.getStartDay(booking);
    let end = this.getEndDay(booking);

    if (start < 1) {
      return 1 + '/' + (end + 1);
    }
    if (end < 1 && start) {
      return this.numberOfDays + '/' + start;
    }

    return start + '/' + (end + 1);
  }

  checkIfCurrentMonth(bookingDetail: any) {
    const toDate = new Date(this.currentMonth);
    toDate.setDate(toDate.getDate() + this.days.length);

    let startDate = new Date(this.currentMonth + '');
    let lastDate = new Date(toDate + '');
    let checkDateStart = new Date(bookingDetail.arrivalDateTime);
    let checkDateEnd = new Date(bookingDetail.departureDateTime);

    if((checkDateStart < lastDate && checkDateStart > startDate) || (checkDateEnd < lastDate && checkDateEnd > startDate)) {
      return true;
    }
    return false;
  }

  getBgColor(booking: IBookingDetails) {
    if (new Date(booking.departureDateTime).getTime() < this.today.getTime()) {
      return 'rgba(29, 211, 211, 0.19)';
    } else if (new Date(booking.arrivalDateTime).getTime() > this.today.getTime()) {
      return 'rgba(145, 70, 106, 0.25)';
    }
    return 'rgba(65, 102, 186, 0.31)';
  }

  getBorderColor(booking: IBookingDetails) {
    if (new Date(booking.departureDateTime).getTime() < this.today.getTime()) {
      return '1px solid rgb(29, 211, 211)';
    } else if (new Date(booking.arrivalDateTime).getTime() > this.today.getTime()) {
      return '1px solid rgb(145, 70, 106)';
    }
    return '1px solid rgb(65, 102, 186)';
  }

  onExpandProperty(properties: string[]) {
    this.expandedProperties = properties;
  }

  foundProperty(propertyId: string) {
    return this.expandedProperties.some(id => id === propertyId);
  }

  onToggleSideNav(bookingDetails: IBookingDetails | null = null, room: IRoom | null = null) {
    if (bookingDetails && room) {
      this.reservationDetails = {
        id: bookingDetails.booking.id,
        name: room.name,
        user: {
          name: bookingDetails.booking.user.name,
          phone: bookingDetails.booking.user.contactPhone,
        },
        listingImage: room.images[0].url,
        rooms: {
          bedrooms: room.bedrooms,
          beds: room.roomType.bedCount,
          bath: room.roomType.bathCount
        },
        status: room.status,
        checkInStatus: {
          checkIn: bookingDetails.arrivalDateTime,
          checkOut: bookingDetails.departureDateTime,
          nights: bookingDetails.dayCount,
        },
        balance: {
          balanceDue: +bookingDetails.totalAfterTax - +bookingDetails.totalPayment,
          paid: bookingDetails.totalPayment,
          payout: ''
        }
      }
      this.sidenav.open();
      this.showQuickReservation = false;
      this.showReservationDetails = !this.showQuickReservation;
    } else {
      this.showReservationDetails = false;
      this.sidenav.close();
    }
  }

  openQuickReservation(startIndex: number, endIndex: number | null = null) {
    this.startDay = this.days[startIndex].date;
    this.endDay = endIndex ? this.days[endIndex].date : '';
    this.sidenav.open();
    this.showReservationDetails = false;
    this.showQuickReservation = true;
  }

  goToToday() {
    let previousDay = this.getPreviousDay(new Date());
    let day = this.formatDate(previousDay);
    this.getCalendarBookings(day);
    this.date.reset(day);
  }

  goToNextDays() {
    let date = new Date(this.days[this.numberOfDays - 2].date);
    date.setDate(date.getDate() + 1);
    this.getCalendarBookings(this.formatDate(new Date(date.toString())));
  }

  goToPrevDays() {
    let date = new Date(this.days[0].date);
    date.setDate(date.getDate() - 14);
    this.getCalendarBookings(this.formatDate(new Date(date.toString())));
  }

  isToday(date: string) {
    return this.formatDate(this.today) === date;
  }

  changeDate() {
    if (this.date.value) {
      let previous = this.getPreviousDay(new Date(this.date.value.toString()));
      this.getCalendarBookings(this.formatDate(previous));
    }
  }

  changeStartDay(day: string) {
    this.getCalendarBookings(day);
  }

  onDragStart(event: any, startIndex: number, roomId: string) {
    this.dropzonIsShown = true;
    this.selectedStartDate = {
      index: startIndex,
      roomId: roomId
    }
    const img = document.createElement("img");
    event.dataTransfer.setDragImage(img, 0, 0);

  }

  onDrop(endIndex: number, roomId: string) {
    if (this.selectedStartDate.index !== undefined &&
      endIndex && this.selectedStartDate.roomId === roomId &&
      this.selectedStartDate.index !== endIndex) {
        if((<number>this.selectedStartDate.index) > endIndex) {
          return;
        }
      this.openQuickReservation(this.selectedStartDate.index as number, endIndex);
    }
  }

  onDragEnter(event: any) {
    event.preventDefault();
  }

  onDragOver(event: any, endIndex: number, roomId: string) {
    event.preventDefault();
    if(this.selectedStartDate && this.selectedStartDate.index != undefined && this.selectedStartDate.roomId === roomId) {
      if(this.bookingReservations[roomId].slice(this.selectedStartDate.index, endIndex + 1).includes(1)) {
        this.resetSelected();
        return;
      }
      this.dropzoneWidth = (endIndex - this.selectedStartDate.index + 1) * 100;
    }
  }

  onDragEnd(event: any) {
    if(event.target.nodeName !== 'LI' || event.target.nodeName !== 'SPAN') {
      this.resetSelected();
    }
  }

  onMouseEnterBooked(roomId: string) {
    if(this.dropzonIsShown && this.selectedStartDate.roomId === roomId) {
      this.resetSelected();
    }
  }

  resetSelected() {
    this.dropzoneWidth = 0;
    this.selectedStartDate = {};
  }
}
