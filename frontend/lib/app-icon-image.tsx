interface AppIconImageProps {
  size: number;
}

const px = (value: number, scale: number): number => Math.round(value * scale);

export default function AppIconImage({ size }: AppIconImageProps) {
  const scale = size / 512;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: px(124, scale),
        background: 'linear-gradient(140deg, #120F18 0%, #211425 58%, #301D33 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 24% 18%, rgba(255,180,153,0.30), transparent 26%), radial-gradient(circle at 78% 18%, rgba(130,202,220,0.24), transparent 22%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: px(126, scale),
          top: px(84, scale),
          width: px(260, scale),
          height: px(228, scale),
          borderRadius: px(74, scale),
          background: 'linear-gradient(135deg, #FF8E72 0%, #FFBE7A 100%)',
          boxShadow: `0 ${px(18, scale)}px ${px(36, scale)}px rgba(12, 10, 18, 0.28)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: px(163, scale),
          top: px(257, scale),
          width: px(84, scale),
          height: px(84, scale),
          borderRadius: px(22, scale),
          transform: 'rotate(45deg)',
          background: 'linear-gradient(135deg, #FF8E72 0%, #FFBE7A 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: px(212, scale),
          top: px(146, scale),
          width: px(44, scale),
          height: px(140, scale),
          borderRadius: px(20, scale),
          background: '#24161A',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: px(212, scale),
          top: px(242, scale),
          width: px(120, scale),
          height: px(44, scale),
          borderRadius: px(20, scale),
          background: '#24161A',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: px(328, scale),
          top: px(126, scale),
          width: px(38, scale),
          height: px(38, scale),
          borderRadius: px(10, scale),
          transform: 'rotate(45deg)',
          background: '#82CADC',
        }}
      />
    </div>
  );
}
