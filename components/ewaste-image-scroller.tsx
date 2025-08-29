import React from "react";

const ewasteImages = [
  "https://thumbs.dreamstime.com/b/electronic-waste-28083357.jpg",
  "https://media.istockphoto.com/id/1032912050/photo/e-waste-heap-from-discarded-laptop-parts.jpg?s=612x612&w=0&k=20&c=0GhFIqXKK1bRzdyMugLkB5Dj7spnwmhgVhRJEwBgoO8=",
  "https://media.istockphoto.com/id/1387310509/photo/woman-putting-an-old-appliance-in-the-waste-bin.jpg?s=612x612&w=0&k=20&c=UBD_06Bgp-r5gccmoooenenK2333468OARZMoF96xPY=",
  "https://media.istockphoto.com/id/1352362769/photo/male-and-female-recycling-coworkers-holding-digital-tablet-and-plastic-box-full-of-mother.jpg?s=612x612&w=0&k=20&c=q_MmxgGUveX1gaEq75trpiE5ShN-t9QGNt-8wKY_aP0=",
  "https://t3.ftcdn.net/jpg/05/68/96/18/360_F_568961895_MN1FE24wtBvcgxml8rTCbJcKYmxu9bhH.jpg",
  "https://t3.ftcdn.net/jpg/08/24/65/06/360_F_824650685_eUJ8uzyev6jIczBxcC4Y8HYC8b4PY2uP.jpg",
  "https://lh3.googleusercontent.com/NtBWFaJaxaxhoZ1FWdyfuw49IGWuXpYssu9fXc5FyrpVfZgIwSsfevZDCzBuCckHtO7joUqBA0JippsSRHywT3Wtu8FUCGkdRi0=s750",
  "https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://storage.googleapis.com/msgsndr/Ww6k6uHghan61OfsMdfi/media/67d7b7a51b97ac8cb2021b71.webp",
  "https://c1.wallpaperflare.com/preview/697/1009/202/mobile-phone-mobile-smartphone-phone-e-waste.jpg",
  "https://images.unsplash.com/photo-1612965110667-4175024b0dcc?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZWxlY3Ryb25pYyUyMHdhc3RlfGVufDB8fDB8fHww"
];

export default function EwasteImageScroller() {
  return (
    <div className="w-full overflow-x-hidden py-6">
      <div className="flex gap-8 animate-ewaste-scroll whitespace-nowrap">
        {ewasteImages.concat(ewasteImages).map((src, i) => (
          <img
            key={i}
            src={src}
            alt="e-waste"
            className="h-48 w-auto rounded-xl shadow-md inline-block object-contain bg-white/80 border border-emerald-100"
            draggable={false}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes ewaste-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ewaste-scroll {
          animation: ewaste-scroll 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
