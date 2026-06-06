interface Props {
  filename: string
}

export default function Titlebar({ filename }: Props) {
  return (
    <div className="titlebar">
      <div className="tl">
        <span className="tl-r" />
        <span className="tl-y" />
        <span className="tl-g" />
      </div>
      <div className="t-center">
        <span className="t-appname">mindmaply</span>
        <span className="t-sep-v" />
        <span className="t-filename">{filename}</span>
      </div>
    </div>
  )
}
