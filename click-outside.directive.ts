import { Directive, ElementRef, EventEmitter, HostListener, Output } from "@angular/core";

@Directive({
    selector: '[clickOutside]',
})
export class ClickOutsideDirective {
    @Output('onClickOutside') onClickOutside = new EventEmitter<MouseEvent>();

    constructor(private _elref: ElementRef) { }

    @HostListener('document:click', ['$event', '$event.target'])
    onDocumentClicked(event: MouseEvent, targetElement: HTMLElement) {
        if (targetElement && document.body.contains(targetElement) && !this._elref.nativeElement.contains(targetElement)) {
            this.onClickOutside.emit(event);
        }
    }
}