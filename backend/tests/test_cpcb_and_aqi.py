import unittest
import os
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.cpcb_service import (
    haversine_distance,
    get_cpcb_category,
    calculate_cpcb_sub_index,
    sub_index_to_concentration,
    parse_station_sub_indices,
    fetch_cpcb_ground_data
)
from app.services.analysis_service import compute_aqi_score
from app import create_app

class TestCPCBAQISystem(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_haversine_distance(self):
        # Distance between Connaught Place Delhi (28.6315, 77.2167) and India Gate (28.6129, 77.2295) ~ 2.4 km
        dist = haversine_distance(28.6315, 77.2167, 28.6129, 77.2295)
        self.assertAlmostEqual(dist, 2.4, delta=0.5)

    def test_cpcb_categories(self):
        self.assertEqual(get_cpcb_category(35)["category"], "Good")
        self.assertEqual(get_cpcb_category(75)["category"], "Satisfactory")
        self.assertEqual(get_cpcb_category(150)["category"], "Moderate")
        self.assertEqual(get_cpcb_category(250)["category"], "Poor")
        self.assertEqual(get_cpcb_category(350)["category"], "Very Poor")
        self.assertEqual(get_cpcb_category(450)["category"], "Severe")
        self.assertEqual(get_cpcb_category(None)["category"], "Unavailable")

    def test_cpcb_sub_index_calculation(self):
        # PM2.5: 30 ug/m3 is breakpoint for 50 sub-index (Good)
        self.assertEqual(calculate_cpcb_sub_index("PM2.5", 30.0), 50)
        # PM2.5: 60 ug/m3 is breakpoint for 100 sub-index (Satisfactory)
        self.assertEqual(calculate_cpcb_sub_index("PM2.5", 60.0), 100)
        # PM2.5: 90 ug/m3 is breakpoint for 200 sub-index (Moderate)
        self.assertEqual(calculate_cpcb_sub_index("PM2.5", 90.0), 200)

    def test_sub_index_inversion(self):
        # Sub-index 100 should invert to approx 60 ug/m3 for PM2.5
        conc = sub_index_to_concentration("PM2.5", 100)
        self.assertAlmostEqual(conc, 60.0, delta=1.0)
        # Sub-index 50 should invert to 30 ug/m3 for PM2.5
        conc_50 = sub_index_to_concentration("PM2.5", 50)
        self.assertAlmostEqual(conc_50, 30.0, delta=1.0)

    def test_cpcb_completeness_validation(self):
        # Station with only 2 pollutants fails CPCB completeness (requires >= 3 with PM)
        xml_incomplete = """
        <Station id="Test Incomplete Station" latitude="28.6" longitude="77.2" lastupdate="30-10-2026 21:00:00">
            <Pollutant_Index id="PM2.5" Avg="60" Hourly_sub_index="120" />
            <Pollutant_Index id="NO2" Avg="40" Hourly_sub_index="50" />
        </Station>
        """
        st_el = ET.fromstring(xml_incomplete)
        pollutants, hr_max, _, _, _ = parse_station_sub_indices(st_el)
        self.assertEqual(len(pollutants), 2)
        has_pm = "PM2.5" in pollutants or "PM10" in pollutants
        valid_count = sum(1 for p in pollutants.values() if p["sub_index_hourly"] is not None or p["sub_index_24h"] is not None)
        # Completeness check fails (< 3)
        self.assertFalse(has_pm and valid_count >= 3)

        # Station with 3 pollutants including PM satisfies completeness
        xml_complete = """
        <Station id="Test Complete Station" latitude="28.6" longitude="77.2" lastupdate="30-10-2026 21:00:00">
            <Pollutant_Index id="PM2.5" Avg="60" Hourly_sub_index="120" />
            <Pollutant_Index id="PM10" Avg="80" Hourly_sub_index="140" />
            <Pollutant_Index id="NO2" Avg="40" Hourly_sub_index="50" />
        </Station>
        """
        st_el_comp = ET.fromstring(xml_complete)
        pollutants_comp, hr_max_comp, hr_dom, _, _ = parse_station_sub_indices(st_el_comp)
        self.assertEqual(len(pollutants_comp), 3)
        valid_count_comp = sum(1 for p in pollutants_comp.values() if p["sub_index_hourly"] is not None or p["sub_index_24h"] is not None)
        self.assertTrue(("PM2.5" in pollutants_comp or "PM10" in pollutants_comp) and valid_count_comp >= 3)
        self.assertEqual(hr_max_comp, 140)
        self.assertEqual(hr_dom, "PM10")

    def test_international_not_applicable(self):
        # Coordinates in London (UK) should return not_applicable for CPCB
        res = fetch_cpcb_ground_data(51.5074, -0.1278, city_name="London", country="United Kingdom")
        self.assertEqual(res["status"], "not_applicable")

    def test_analysis_scoring_scales(self):
        # US EPA AQI 100 -> score 70.0
        epa_score = compute_aqi_score(100, scale="us_epa")
        self.assertEqual(epa_score["score"], 70.0)
        self.assertEqual(epa_score["unit"], "US EPA AQI")

        # CPCB AQI 100 -> score 75.0 (Satisfactory boundary in Indian scale)
        cpcb_score = compute_aqi_score(100, scale="cpcb")
        self.assertEqual(cpcb_score["score"], 75.0)
        self.assertEqual(cpcb_score["unit"], "India National AQI (CPCB)")

if __name__ == "__main__":
    unittest.main()
