import { Music } from 'lucide-react';

const MusicalAnimation = () => {
  const staffLines = Array(5).fill(0);

  return (
    <div className="relative h-[3em] w-full bg-transparent">
      <div className="absolute left-1/2 -translate-x-1/2 w-64">
        {staffLines.map((_, index) => (
          <div
            key={`staff-${index}`}
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent -mt-1"
            style={{
              top: `${index * 7}px`,
            }}
          />
        ))}

        {/* musical notes */}
        <div className="absolute inset-0 -ml-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={`note-${i}`}
              className={`absolute inline-block animate-[bounce_2s_ease-in-out_infinite]
                ${i === 0 ? 'delay-0' : ''}
                ${i === 1 ? 'delay-500' : ''}
                ${i === 2 ? 'delay-1000' : ''}`}
              style={{
                left: `${i * 20 + 30}%`,
                top: '-8px'
              }}
            >
              <div 
                className="opacity-0"
                style={{
                  animation: `fadeIn 1.5s ease-out ${i * 0.5}s forwards`
                }}
              >
                <Music 
                  className={`text-primary
                    ${i === 0 ? 'w-8 h-8' : ''}
                    ${i === 1 ? 'w-6 h-6 opacity-70' : ''}
                    ${i === 2 ? 'w-8 h-8' : ''}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default MusicalAnimation;