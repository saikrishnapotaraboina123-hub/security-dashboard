import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

type Props = {
  events: {
    device_name: string;
    mac_address: string;
    esp32_location: string;
  }[];
};

export default function PatrolMap({ events }: Props) {
  // simple fallback coordinates (Chennai center)
  const center: [number, number] = [13.0827, 80.2707];

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-800">

      <MapContainer center={center} zoom={13} className="h-full w-full">

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {events.map((e, i) => {
          // simple hash-based fake coords (since esp32_location is text)
          const lat = 13.08 + (i * 0.01);
          const lng = 80.27 + (i * 0.01);

          return (
            <Marker key={i} position={[lat, lng]}>

              <Popup>
                <div className="text-black">
                  <b>{e.device_name}</b>
                  <br />
                  {e.mac_address}
                  <br />
                  {e.esp32_location}
                </div>

              </Popup>

            </Marker>
          );
        })}

      </MapContainer>

    </div>
  );
}
