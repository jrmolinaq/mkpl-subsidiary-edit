import { Component, OnInit } from '@angular/core';
import { SubsidiaryService } from './services/subsidiary.service';
import { Observable, combineLatest } from 'rxjs';
import { switchMap, pluck, map } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';

import { RegionInterface, CountryInterface, CityInterface } from './interfaces/locations.interface';
import { LocationsService } from './services/locations.service';
import { ModalService } from './services/modal.service';
import { FormService } from './services/form.service';
import { FIELDS } from './constants/edit-subsidiary-constants';
import { SubsidiaryDetail } from './interfaces/subsidiaries.interface';
import { COLOMBIA } from './constants/location';

declare const Liferay: any;

@Component({
	templateUrl: 
		Liferay.ThemeDisplay.getPathContext() + 
		'/o/mkpl-subsidiary-edit/app/app.component.html'
})
export class AppComponent implements OnInit {
	subsidiaryDetails: SubsidiaryDetail;
	form: FormGroup;
	subsidiary: any;
	regions: RegionInterface[];
	regional: any[] = [];
	generalCities: any[] = [];
	countries: CountryInterface[];
	cities: CityInterface[];
	//citiesDelivery: CityInterface[] = [];
	//showCities = false;
	//showRegions = false;
	showConfirmModal = false;
	requestError = false;
	generalShow = true;
	contactShow = true;
	//deliveryShow = true;
	loading = false;
  
	constructor(
	  private subsidiaryService: SubsidiaryService,
	  private locationService: LocationsService,
	  private modalService: ModalService,
	  private formService: FormService
	) { }
  
	ngOnInit() {
	  this.form = this.formService.createForm(FIELDS);
  
	  this.subsidiaryService.getSubsidiary(this.getURLParameter("id"))
	  .subscribe(subsidiary => {
			this.subsidiary = subsidiary;
			this.setSubsidiary(subsidiary);
			this.subsidiaryDetails = subsidiary;

			this.locationService.getCountries()
			.subscribe(countries => {
				this.countries = countries;

				this.locationService.getRegions(COLOMBIA)
				.subscribe(regions => {
					this.regions = regions;

					console.log('***', subsidiary.location.city.region.id);

					this.locationService.getCities(subsidiary.location.city.region.id)
					.subscribe(cities => {
						this.cities = cities;
					});

				})

			})

	});

	  /* this.$subsidiaryDetails = combineLatest([
		this.locationService.getCountries().pipe(pluck('data')),
		this.locationService.getRegions(COLOMBIA).pipe(pluck('data'))
	  ])
		.pipe(
		  switchMap(([countries, regions]) => {
			this.countries = countries;
			this.regions = regions.map(region => ({ ...region, days: 0 }));
			return combineLatest(
			  regions.map(region =>
				this.locationService.getCities(region.id).pipe(pluck('data'))
			  )
			) as Observable<CityInterface[]>;
		  }),
		  map((cities: CityInterface[]) =>
			cities.reduce((currentCities, actualCities) => currentCities.concat(actualCities), [])
		  ),
		  map((cities: CityInterface[]) =>
			cities.reduce((currentCities, actualCity) => currentCities.concat({ ...actualCity, days: 0 }), [])
		  ),
		  switchMap(cities => {
			this.cities = cities;
			return this.subsidiaryService.getSubsidiary(this.route.snapshot.paramMap.get('id'));
		  }),
		  map(subsidiary => {
			this.subsidiary = subsidiary;
			this.setSubsidiary(subsidiary);
			return subsidiary;
		  })
		); */
	}
  
	setSubsidiary(subsidiary: SubsidiaryDetail) {
	  this.locationService.getCities(subsidiary.location.city.region.id).subscribe(response => this.generalCities = response);
	  this.form.setValue({
		general: {
		  company: subsidiary.alias,
		  country: subsidiary.location.city.region.country.id,
		  regional: subsidiary.location.city.region.id,
		  city: subsidiary.location.city.id,
		  address: subsidiary.location.address
		},
		contact: {
		  contactName: subsidiary.name,
		  contactPhone: subsidiary.phone,
		  contactEmail: subsidiary.email,
		  adminEmail: subsidiary.admin_user.email
		}
	  });

	  /* const defaultValue = { days: 0 };
	  this.cities = this.cities.map(city => {
		const { days } = subsidiary.timeCitiesDelivery.find(cityDelivery => cityDelivery.city.id === city.id) || defaultValue;
		return { ...city, days };
	  });
	  this.regions = this.regions.map(region => {
		const { days } = subsidiary.timeRegionsDelivery.find(regionDelivery => regionDelivery.region.id === region.id) || defaultValue;
		return { ...region, days };
	  }); */
	}
  
	changeCountry(value: number) {
	  this.locationService.getRegions(value).subscribe(data => (this.regions = data), () => this.regions = []);
	  this.form.get('general.regional').setValue('');
	}
  
	changeRegional(value: number) {
	  this.locationService.getCities(value).subscribe( data => (this.cities = data), () => this.cities = []);
	  this.form.get('general.city').setValue('');
	}
  
	changeCity(value: any) {
	  this.form.get('general.city').setValue(value);
	}
  
	/* setLocations(event) {
	  this.cities = event.cities;
	  this.regions = event.regions;
	} */
  
	saveChanges() {
	  const subsidiary = { id: this.getURLParameter("id"), ...this.toCreateSubsidiary(this.form) };

	  // TODO traer información desde liferay
	  const cityId = this.form.get('general.city').value;
	  const providerId = '1';
	  this.loading = true;

	  this.subsidiaryService.updateSubsidiary(
		subsidiary,
		cityId,
		providerId
	  ).subscribe(
		() => this.requestError = false,
		() => this.requestError = true,
		() => {
		  this.openModal();
		  this.loading = false;
		}
	  );

	  /* this.authService
		.getProfile()
		.pipe(
		  switchMap(user => {
			const cityId = this.form.get('general.city').value;
			const providerId = user.providerId.toString();
			this.loading = true;
			return this.subsidiaryService.updateSubsidiary(
			  subsidiary,
			  cityId,
			  providerId
			);
		  })
		).subscribe(
		  () => this.requestError = false,
		  () => this.requestError = true,
		  () => {
			this.openModal();
			this.loading = false;
		  }
		); */
	}
  
	openModal() {
	  this.modalService.open('modal-subsidiary-edit');
	}
  
	closeModal() {
	  this.modalService.close('modal-subsidiary-edit');
	  if (!this.requestError) {
		window.location.href = "/subsidiary";
	  }
	}
  
	toggleCard(card: string) {
	  this[`${card}Show`] = !this[`${card}Show`];
	}

	// this.getURLParameter("id")
	private getURLParameter(paramName: string){
	  var pageURL = window.location.search.substring(1);
	  var variables = pageURL.split('&');
	  for (var i = 0; i < variables.length; i++) {
	    var param = variables[i].split('=');
	    if (param[0] == paramName) {
	      return param[1];
	    }
	  }
	}​

	
///// Mapper


toCreateSubsidiary(form: FormGroup) {
	const generalGet = this.getFromForm(form, 'general');
	const contactGet = this.getFromForm(form, 'contact');
	return {
	  status: true,
	  alias: generalGet('company'),
	  location: { address: generalGet('address') },
	  name: contactGet('contactName'),
	  phone: contactGet('contactPhone'),
	  email: contactGet('contactEmail'),
	  admin_user: { email: contactGet('adminEmail') }
	};
  }
  
  getFromForm(form: FormGroup, formName: string) {
	return (attribute: any) => form.get(`${formName}.${attribute}`).value;
  }
}
