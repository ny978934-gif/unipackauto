import catalogPdf from '../assests/unipackauto-india.pdf';
import './Catalog.css';

export default function Catalog() {
	return (
		<section className="catalog-page" aria-labelledby="catalog-title">
			<div className="catalog-page__header">
				<div>
					<span className="catalog-page__eyebrow">Unipackauto India Pvt. Ltd.</span>
					<h1 id="catalog-title">Product Catalogue</h1>
					<p>Browse our industrial packaging machinery catalogue.</p>
				</div>
				<a className="catalog-page__download" href={catalogPdf} download="unipackauto-india-catalogue.pdf">
					Download PDF
				</a>
			</div>

			<div className="catalog-page__viewer">
				<iframe
					src={catalogPdf}
					title="Unipackauto product catalogue"
					className="catalog-page__pdf"
				/>
			</div>
		</section>
	);
}
