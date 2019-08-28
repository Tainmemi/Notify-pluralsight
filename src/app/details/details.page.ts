import { Component, OnInit } from '@angular/core';
import { EventResponse, EmergencyEvent, Acknowledgement } from '../interfaces';
import { ActivatedRoute } from '@angular/router';
import { EventsService } from '../events.service';
import { Network } from '@ngx-pwa/offline';


@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {
  eventId: number;
  eventResponse: EventResponse;
  event: EmergencyEvent;
  acknowledments: Acknowledgement[] = [];
  newNote = '';
  online$ = this.network.onlineChanges;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventsService,
    private network: Network
  ) { }

  async ngOnInit() {
    this.eventId = +this.route.snapshot.params['eventId']; // eventId (at the end) >> eventId at app.routing.modult.ts
    // + It's string but want to make it a number
    this.eventResponse = await this.eventService.getById(this.eventId).toPromise(); 
    // getById and almost function that delas with web services in Angular return an Observable(stream event)
    // Observable to Promise
    this.event = this.eventResponse.event;
    this.acknowledments = await this.eventService.getAcknowledgements(this.eventResponse)
    .toPromise();
  }

}
