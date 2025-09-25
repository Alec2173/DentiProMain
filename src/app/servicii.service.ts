import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ServiciiService {
  constructor() {}
  serviceList = [
    { id: 'obturatii', label: 'Obturatii' },
    { id: 'albire', label: 'Albire dentară' },
    { id: 'detartraj', label: 'Detartraj' },
    { id: 'implanturi', label: 'Implanturi' },
    { id: 'aparate', label: 'Aparate dentare' },
    { id: 'protetica', label: 'Protetică' },
    { id: 'chirurgie', label: 'Chirurgie' },
    { id: 'pedodontie', label: 'Pedodonție' },
    { id: 'ortodontie', label: 'Ortodonție' },
    { id: 'endodontie', label: 'Endodonție (tratament de canal)' },
    { id: 'radiologie', label: 'Radiologie dentară' },
    { id: 'profilaxie', label: 'Profilaxie' },
    { id: 'estetica', label: 'Estetică dentară' },
    { id: 'fatete', label: 'Fațete dentare' },
    { id: 'coronite', label: 'Coroane dentare' },
    { id: 'proteze', label: 'Proteze dentare' },
    { id: 'dantura', label: 'Reconstrucție dentară completă' },
    { id: 'bruxism', label: 'Tratament pentru bruxism' },
    { id: 'pediatrica', label: 'Stomatologie pediatrică' },
    { id: 'anxietate', label: 'Tratamente cu sedare pentru pacienți anxioși' },
    { id: 'grefe', label: 'Grefe osoase' },
    { id: 'sinuslift', label: 'Sinus lift' },
    { id: 'laser', label: 'Tratamente cu laser' },
    { id: 'analgesie', label: 'Anestezie fără ac (analgezie)' },
    { id: 'digital', label: 'Consult digital' },
    { id: 'altele', label: 'Altele' },
  ];

  getServices() {
    return this.serviceList;
  }
  getServiciuName() {
    return this.serviceList.map((service) => service.label);
  }
}
