import 'zone.js';
import { createApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { App } from './app/app';

createApplication({
    providers: [importProvidersFrom(BrowserModule)]
}).then(appRef => {
    const injector = appRef.injector;
    const el = createCustomElement(App, { injector });
    customElements.define('angular-app', el);
    console.log('✅ Angular Web Component registered');
});
