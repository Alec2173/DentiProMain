import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlanDef } from '../plan.model';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './plan-card.component.html',
  styleUrl: './plan-card.component.css',
})
export class PlanCardComponent {
  /** The plan definition to render */
  @Input() plan!: PlanDef;

  /** Toggle between monthly and annual pricing */
  @Input() billingAnnual = false;

  /**
   * When true the card is rendered in "selectable" mode (inside the
   * registration form). The CTA becomes a button that emits selectPlan.
   */
  @Input() selectable = false;

  /** Whether this card is currently the selected plan (selectable mode) */
  @Input() selected = false;

  /**
   * Route to navigate to when CTA is clicked in non-selectable mode.
   * Defaults to /clinici/inscriere?plan=<id>
   */
  @Input() ctaRoute: string | null = null;
  @Input() ctaQueryParams: Record<string, string> = {};

  @Output() selectPlan = new EventEmitter<string>();

  get displayPrice(): number {
    return this.billingAnnual ? this.plan.annualMonthlyPrice : this.plan.monthlyPrice;
  }

  get defaultCtaRoute(): string {
    return this.ctaRoute ?? '/clinici/inscriere';
  }

  get defaultCtaParams(): Record<string, string> {
    return Object.keys(this.ctaQueryParams).length ? this.ctaQueryParams : { plan: this.plan.id };
  }

  onCta(event: Event): void {
    if (this.selectable) {
      event.preventDefault();
      this.selectPlan.emit(this.plan.id);
    }
  }
}
