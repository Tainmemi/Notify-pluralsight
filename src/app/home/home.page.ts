import { Component, OnInit, OnDestroy, ApplicationRef } from '@angular/core';
import { EventResponse } from '../interfaces';
import { Subscription, interval, concat } from 'rxjs';
import { EventsService } from '../events.service';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { Network } from '@ngx-pwa/offline';
import { SwUpdate, UpdateAvailableEvent, UpdateActivatedEvent } from '@angular/service-worker';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  events: EventResponse[] = [];
  subscriptions: Subscription[] = [];
  online$ = this.network.onlineChanges;

  constructor(
    private eventService: EventsService,
    private nav: NavController,
    private network: Network,
    private updater: SwUpdate,
    private toastController: ToastController,
    private alertController: AlertController,
    private appRef: ApplicationRef) { }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    this.subscriptions.push(this.eventService.getAll().subscribe(e => this.events.push(e)));
    this.initUpdater();
  }

  initUpdater() {
    // Allow the app to stabilize first, before starting polling for updates with `interval()`.
    // See https://angular.io/guide/service-worker-communications
    const updateInterval$ = interval(1000 * 60 * 1);  // 1 minute - I don't recommend this! Just for test
    const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable === true));
    const appStableInterval$ = concat(appIsStable$, updateInterval$); // $at the back it means it is an anobservable

    // Warning! Make sure you use arrow functions here or suffer the wrath of `this`!
    if (this.updater.isEnabled) {
      console.log('Subscribing to updates...');
      this.subscriptions.push(appStableInterval$.subscribe(() => this.checkForUpdate()));
      this.subscriptions.push(this.updater.available.subscribe(e => this.onUpdateAvailable(e)));
      this.subscriptions.push(this.updater.activated.subscribe((e) => this.onUpdateActivated(e)));
    }
  }

  async checkForUpdate() {
    if (this.updater.isEnabled) {
      await this. updater.checkForUpdate();
    }
  }

  async onUpdateActivated(e: UpdateActivatedEvent) {
    await this.showToastMessage('Application updating.');
  }

  async showToastMessage(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      showCloseButton: true,
      position: 'top',
      closeButtonText: 'OK'
    });
    toast.present();
  }

  async onUpdateAvailable(event: UpdateAvailableEvent) {
    const updateMessage = event.available.appData['updateMessage'];
    console.log('A new version is available: ', updateMessage);

    const alert = await this.alertController.create({
      header: 'Update Available!',
      message: 'New version is available.' +
        `(Details: ${updateMessage}) ` +
        'Click OK to update now.',
      buttons: [
        {
          text: 'Not Now',
          role: 'cancel',
          handler: async () => {
            this.showToastMessage('Update deferred');
          }
        }, {
          text: 'OK',
          handler: async () => {
            await this.updater.activateUpdate();
            window.location.reload();
          }
        }
      ]
    });
    await alert.present();

  }

  getEvents(): EventResponse[] {
    return this.events.sort((a, b) => a.event.created > b.event.created ? -1 : 1); //events >> array
  }

  details(response: EventResponse) {
    this.nav.navigateForward(`/details/${response.event.id}`);
  }
}
