import { Component, Inject, OnInit } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators, AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { City } from './City';
import { Country } from './../countries/Country';
import { CityService } from './city.service';
import { ApiResult } from '../base.service';

import { BaseFormComponent } from '../base.form.component';

@Component({
  selector: 'app-city-edit',
  templateUrl: './city-edit.component.html',
  styleUrls: ['./city-edit.component.css']
})
export class CityEditComponent
  extends BaseFormComponent
  implements OnInit {
  // the view title
  title: string;

  // the form model
  form: FormGroup;

  // the city object to edit or create
  city: City;

  // the city object id, as fetched from the active route:
  // It's NULL when we're adding a new city,
  // and not NULL when we're editting an existing one.
  id?: number;

  // the countries array for the select
  countries: Country[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private cityService: CityService) {
      super();
  }

  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl('', Validators.required),
      lat: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[-]?\d+(\.\d{1,4})?$/)
      ]),
      lon: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[-]?\d+(\.\d{1,4})?$/)
      ]),
      countryId: new FormControl('', Validators.required)
    }, null, this.isDupeCity());

    this.loadData();
  }

  loadData() {
    // load countries
    this.loadCountries();

    // retrieve the ID from the 'id' parameter
    this.id = +this.activatedRoute.snapshot.paramMap.get('id');

    if (this.id) {
      // EDIT MODE
      // fetch the city from the server
      this.cityService.get<City>(this.id).subscribe(result => {
        this.city = result;
        this.title = "Edit - " + this.city.name;

        // update the form with the city value
        this.form.patchValue(this.city);
      }, error => console.error(error));
    }
    else {
      // ADD NEW MODE
      this.title = "Create a new City";
    }
  }

  loadCountries() {
    // fetch all the countries from the server
    this.cityService.getCountries<ApiResult<Country>>(
      0,
      9999,
      "name",
      null,
      null,
      null
      ).subscribe(result => {
        this.countries = result.data;
      }, error => console.error(error));
  }

  onSubmit() {
    var city = (this.id) ? this.city : <City>{};

    city.name = this.form.get("name").value;
    city.lat = +this.form.get("lat").value;
    city.lon = +this.form.get("lon").value;
    city.countryId = +this.form.get("countryId").value;

    if (this.id) {
      // EDIT MODE
      this.cityService
        .put<City>(city)
        .subscribe(result => {
          console.log("City " + city.id + " has been updated.");

          // go back to cities view
          this.router.navigate(['/cities']);
        }, error => console.error(error));
    }
    else {
      // ADD NEW MODE
      this.cityService
        .post<City>(city)
        .subscribe(result => {
          console.log("City " + result.id + " has been created.");

          // go back to cities view
          this.router.navigate(['/cities']);
        }, error => console.error(error));
    }
  }

  isDupeCity(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<{ [key: string]: any } | null> => {
      var city = <City>{};
      city.id = (this.id) ? this.id : 0;
      city.name = this.form.get("name").value;
      city.lat = +this.form.get("lat").value;
      city.lon = +this.form.get("lon").value;
      city.countryId = +this.form.get("countryId").value;

      return this.cityService.isDupeCity(city)
        .pipe(map(result => {
          return (result ? { isDupeCity: true } : null);
        }));
    }
  }
}
