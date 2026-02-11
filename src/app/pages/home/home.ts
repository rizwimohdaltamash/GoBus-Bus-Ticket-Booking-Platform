import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatIcon],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home { }
