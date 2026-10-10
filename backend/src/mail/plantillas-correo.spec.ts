import { escaparHtml } from './plantillas-correo';

describe('escaparHtml', () => {
  it('neutraliza HTML que escribe un usuario en su nombre o en una consulta', () => {
    expect(escaparHtml('<a href="x">Juan & \'Ana\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;Juan &amp; &#39;Ana&#39;&lt;/a&gt;');
  });
});
