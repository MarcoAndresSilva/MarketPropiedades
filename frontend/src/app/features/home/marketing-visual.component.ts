import { Component } from '@angular/core';
import { IconComponent } from '../../core/icon.component';

// Composición decorativa de la sección de marketing del render: foto de una casa, un
// celular con un "reel", los logos de Instagram/Facebook y una tarjeta con lo que
// reporta una campaña. La tarjeta nombra las métricas sin cifras: el render traía
// números de ejemplo ("12.4K") que no son resultados reales de Habbi.
@Component({
  selector: 'app-marketing-visual',
  imports: [IconComponent],
  templateUrl: './marketing-visual.component.html',
  styleUrl: './marketing-visual.component.scss',
})
export class MarketingVisualComponent {}
